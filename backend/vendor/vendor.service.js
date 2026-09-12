// Public Overpass API mirrors — tried in order, first success wins
const OVERPASS_MIRRORS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];

/**
 * POST an Overpass QL query to the first available mirror.
 * Each mirror gets a hard 28-second HTTP timeout (the query itself
 * uses [timeout:25] so the server should reply before we abort).
 * Throws a user-friendly Error only if every mirror fails.
 */
async function tryOverpass(query) {
  const errors = [];

  for (const url of OVERPASS_MIRRORS) {
    let res;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'EventManagement/1.0',
        },
        body: `data=${encodeURIComponent(query)}`,
        signal: AbortSignal.timeout(28_000),   // 28 s hard deadline
      });
    } catch (err) {
      // Network error or timeout for this mirror
      errors.push(`${url}: ${err.message}`);
      continue;
    }

    // 429 / 504 / 5xx from this mirror — try the next one
    if (!res.ok) {
      const statusText = res.status;
      errors.push(`${url}: HTTP ${statusText}`);
      continue;
    }

    // Success
    return res.json();
  }

  // All mirrors failed
  throw new Error(
    `Vendor search is temporarily unavailable (all Overpass mirrors failed). ` +
    `Please try again in a few moments. Details: ${errors.join(' | ')}`
  );
}

const vendorTags = {
  photographer: 'craft="photographer"',
  bakery: 'shop="bakery"',
  florist: 'shop="florist"',
  hotel: 'tourism="hotel"',
  catering: 'amenity="restaurant"',
  entertainment: 'amenity="theatre"',
  decoration: 'shop="interior_decoration"',
  restaurant: 'amenity="restaurant"',
};

// ─────────────────────────────────────────────────────────────────────────────
//  Utilities
// ─────────────────────────────────────────────────────────────────────────────

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/** Decode common HTML entities in a string. */
function decodeHtmlEntities(str) {
  if (!str) return str;
  return str
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#039;/gi, "'")
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)));
}

/** Run at most `limit` async tasks concurrently from an array of thunks. */
async function pLimit(thunks, limit) {
  const results = new Array(thunks.length);
  let idx = 0;

  async function worker() {
    while (idx < thunks.length) {
      const i = idx++;
      results[i] = await thunks[i]();
    }
  }

  const workers = Array.from({ length: Math.min(limit, thunks.length) }, worker);
  await Promise.all(workers);
  return results;
}

// ─────────────────────────────────────────────────────────────────────────────
//  URL helpers
// ─────────────────────────────────────────────────────────────────────────────

function normalizeWebsiteUrl(website) {
  if (!website) return null;
  let url = decodeHtmlEntities(website.trim());
  if (!url) return null;
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) return null;
    return parsed.href;
  } catch {
    return null;
  }
}

function getBestWebsite(tags) {
  return (
    normalizeWebsiteUrl(tags.website) ||
    normalizeWebsiteUrl(tags['contact:website']) ||
    normalizeWebsiteUrl(tags.url) ||
    null
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Image URL filters
// ─────────────────────────────────────────────────────────────────────────────

/** True when a URL is definitely NOT a usable photo. */
function isObviouslyNotAnImage(url) {
  if (!url) return true;
  const lower = url.toLowerCase();

  if (lower.startsWith('data:')) return true;
  if (/favicon/.test(lower)) return true;
  // 1×1 tracking pixel
  if (/[?&](width|w)=1(&|$)/.test(lower) && /[?&](height|h)=1(&|$)/.test(lower)) return true;
  // Very small explicit size in URL
  if (/[?&]s=\d{1,2}(&|$)/.test(lower)) return true;

  return false;
}

/**
 * True if a URL, found in a raw <img> tag, looks like a real photo
 * (not a logo, icon, or tracker).
 *
 * og:image/twitter:image are accepted WITHOUT this check — they are
 * explicitly the page's canonical share image.
 */
function looksLikePhoto(url) {
  if (isObviouslyNotAnImage(url)) return false;

  // Recognizable image extension
  if (/\.(jpe?g|png|webp|gif|avif)(\?|#|$)/i.test(url)) return true;

  // Known image CDN / hosting patterns
  if (/cloudinary|imgix|cloudfront|amazonaws|googleusercontent|twimg|fbcdn|cdninstagram|bunnycdn/i.test(url)) return true;

  // Common image path segments (including WordPress uploads)
  if (/\/(images?|photos?|media|uploads?|img|pictures?|gallery|wp-content\/uploads)\//i.test(url)) return true;

  return false;
}

/**
 * Pick the best candidate from a srcset attribute string.
 * Returns the URL with the largest declared width, or the last one if no
 * width descriptors are present.
 */
function bestFromSrcset(srcset) {
  if (!srcset) return null;
  const entries = srcset
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const parts = s.split(/\s+/);
      const url = parts[0];
      const width = parts[1] ? parseInt(parts[1], 10) : 0;
      return { url, width };
    });
  if (!entries.length) return null;
  // Sort descending by declared width; fall back to last entry
  entries.sort((a, b) => b.width - a.width);
  return entries[0].url || null;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Validate that a URL actually serves an image (lightweight HEAD check)
// ─────────────────────────────────────────────────────────────────────────────

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];

async function validateImageUrl(url) {
  if (!url) return false;
  try {
    // Try HEAD first (faster, no body transfer)
    let res = await fetch(url, {
      method: 'HEAD',
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(5000),
    });
    // Some servers reject HEAD — fall back to GET with range
    if (!res.ok || !res.headers.get('content-type')) {
      res = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0',
          Range: 'bytes=0-1023',
        },
        signal: AbortSignal.timeout(5000),
      });
    }
    if (!res.ok) return false;
    const ct = res.headers.get('content-type') || '';
    return ACCEPTED_IMAGE_TYPES.some((t) => ct.toLowerCase().includes(t));
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  OSM tag → image URL
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extract the best image URL from OSM tags alone (no web requests).
 *
 * Priority:
 *   1. image          — direct URL
 *   2. wikimedia_commons — resolved via Special:FilePath
 *   3. mapillary      — resolved via public CDN if it looks like an image key
 *   4. panoramax      — resolved via public API
 *   5. kartaview      — resolved via public API
 *   6. flickr         — resolved if it contains a raw URL
 *
 * Returns { url, source } or null.
 */
function getOsmImage(tags) {
  // 1. Direct image URL
  if (tags.image) {
    const raw = decodeHtmlEntities(tags.image.trim());
    try {
      const parsed = new URL(raw);
      if (['http:', 'https:'].includes(parsed.protocol)) {
        return { url: parsed.href, source: 'OSM image tag' };
      }
    } catch { /* not a URL */ }
  }

  // 2. Wikimedia Commons — "File:Foo.jpg" or bare filename
  if (tags.wikimedia_commons) {
    const raw = decodeHtmlEntities(tags.wikimedia_commons.trim());
    const fileName = raw.replace(/^(File|Category):/i, '').trim();
    if (fileName && !/^Category:/i.test(raw)) {
      // Category pages don't have a single image — skip
      const url = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileName)}`;
      return { url, source: 'OSM wikimedia_commons' };
    }
  }

  // 3. Mapillary — if the value looks like a sequence/image key, use the
  //    Mapillary Graph API thumbnail endpoint (v4, no token needed for thumbs)
  if (tags.mapillary) {
    const raw = decodeHtmlEntities(tags.mapillary.trim());
    // Mapillary sequence IDs are typically long alphanumeric strings
    if (/^[a-zA-Z0-9_-]{10,}$/.test(raw)) {
      // Public thumbnail URL (no API key required)
      const url = `https://graph.mapillary.com/${raw}/thumb?size=1024`;
      return { url, source: 'OSM mapillary' };
    }
    // Could also be a direct URL
    try {
      const parsed = new URL(raw);
      if (['http:', 'https:'].includes(parsed.protocol)) {
        return { url: parsed.href, source: 'OSM mapillary URL' };
      }
    } catch { /* ignore */ }
  }

  // 4. Panoramax — public image API
  if (tags.panoramax) {
    const raw = decodeHtmlEntities(tags.panoramax.trim());
    try {
      const parsed = new URL(raw);
      if (['http:', 'https:'].includes(parsed.protocol)) {
        return { url: parsed.href, source: 'OSM panoramax' };
      }
    } catch { /* ignore */ }
    // Bare ID form
    if (/^[a-zA-Z0-9_-]{8,}$/.test(raw)) {
      return { url: `https://api.panoramax.xyz/api/pictures/${raw}/sd.jpg`, source: 'OSM panoramax ID' };
    }
  }

  // 5. KartaView (formerly OpenStreetCam)
  if (tags.kartaview) {
    const raw = decodeHtmlEntities(tags.kartaview.trim());
    try {
      const parsed = new URL(raw);
      if (['http:', 'https:'].includes(parsed.protocol)) {
        return { url: parsed.href, source: 'OSM kartaview' };
      }
    } catch { /* ignore */ }
  }

  // 6. Flickr — only accept if it's a direct image URL
  if (tags.flickr) {
    const raw = decodeHtmlEntities(tags.flickr.trim());
    try {
      const parsed = new URL(raw);
      if (['http:', 'https:'].includes(parsed.protocol) && looksLikePhoto(parsed.href)) {
        return { url: parsed.href, source: 'OSM flickr' };
      }
    } catch { /* ignore */ }
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Website scraper
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch a vendor's website and extract the best image URL.
 *
 * Priority:
 *   1. og:image / og:image:secure_url  (all attribute orderings)
 *   2. twitter:image / twitter:image:src
 *   3. link[rel="image_src"]  (older convention)
 *   4. <img> with data-src / data-lazy-src (lazy-loaded)
 *   5. <img> srcset best candidate
 *   6. <img> src
 *
 * All relative URLs are resolved to absolute.
 * Returns { url, source } or null.
 */
async function getWebsiteImage(websiteUrl) {
  if (!websiteUrl) return null;

  let html;
  try {
    const res = await fetch(websiteUrl, {
      method: 'GET',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
          '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    // Only parse HTML documents
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('text/html') && !ct.includes('application/xhtml')) return null;
    html = await res.text();
  } catch {
    return null;
  }

  /** Resolve + decode a raw src/content value against the page URL. */
  function resolve(raw) {
    if (!raw) return null;
    const cleaned = decodeHtmlEntities(raw.trim());
    if (!cleaned || cleaned.startsWith('data:')) return null;
    try {
      return new URL(cleaned, websiteUrl).href;
    } catch {
      return null;
    }
  }

  // ── 1. og:image (all attribute orderings) ────────────────────────────────
  const ogPatterns = [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
    /<meta[^>]+property=["']og:image:secure_url["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image:secure_url["']/i,
  ];
  for (const pat of ogPatterns) {
    const m = html.match(pat);
    if (m?.[1]) {
      const url = resolve(m[1]);
      if (url && !isObviouslyNotAnImage(url)) return { url, source: 'website og:image' };
    }
  }

  // ── 2. twitter:image ─────────────────────────────────────────────────────
  const twPatterns = [
    /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i,
    /<meta[^>]+name=["']twitter:image:src["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image:src["']/i,
  ];
  for (const pat of twPatterns) {
    const m = html.match(pat);
    if (m?.[1]) {
      const url = resolve(m[1]);
      if (url && !isObviouslyNotAnImage(url)) return { url, source: 'website twitter:image' };
    }
  }

  // ── 3. <link rel="image_src"> ────────────────────────────────────────────
  const linkImgMatch = html.match(/<link[^>]+rel=["']image_src["'][^>]+href=["']([^"']+)["']/i)
    || html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']image_src["']/i);
  if (linkImgMatch?.[1]) {
    const url = resolve(linkImgMatch[1]);
    if (url && !isObviouslyNotAnImage(url)) return { url, source: 'website link[image_src]' };
  }

  // ── 4–6. Scan <img> tags (lazy-loaded, srcset, src) ──────────────────────
  // We collect ALL img tags then apply filters
  const imgTagRegex = /<img\s([^>]*)>/gi;
  let imgMatch;

  while ((imgMatch = imgTagRegex.exec(html)) !== null) {
    const attrs = imgMatch[1];

    // Extract individual attributes we care about
    function attr(name) {
      // name="value" or name='value'
      const m = attrs.match(new RegExp(`${name}=["']([^"']+)["']`, 'i'));
      return m ? m[1] : null;
    }

    // 4a. data-src (lazy-loaded)
    const dataSrc = attr('data-src') || attr('data-lazy-src') || attr('data-original');
    if (dataSrc) {
      const url = resolve(dataSrc);
      if (url && looksLikePhoto(url)) return { url, source: 'website img[data-src]' };
    }

    // 4b. srcset — pick the largest candidate
    const srcsetRaw = attr('srcset') || attr('data-srcset');
    if (srcsetRaw) {
      const best = bestFromSrcset(srcsetRaw);
      if (best) {
        const url = resolve(best);
        if (url && looksLikePhoto(url)) return { url, source: 'website img[srcset]' };
      }
    }

    // 4c. src
    const src = attr('src');
    if (src) {
      const url = resolve(src);
      if (url && looksLikePhoto(url)) return { url, source: 'website img[src]' };
    }
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Main export
// ─────────────────────────────────────────────────────────────────────────────

exports.searchNearby = async ({
  type,
  latitude,
  longitude,
  radius = 5000,
}) => {
  const tag = vendorTags[type];
  if (!tag) throw new Error(`Unsupported vendor type: ${type}`);

  // ── 1. Fetch from Overpass ──────────────────────────────────────────────
  // [timeout:20] is the server-side query limit (seconds).
  // tryOverpass() adds a 28-second HTTP abort on top of that.
  const query = `
    [out:json][timeout:20];
    (
      node[${tag}](around:${radius},${latitude},${longitude});
      way[${tag}](around:${radius},${latitude},${longitude});
      relation[${tag}](around:${radius},${latitude},${longitude});
    );
    out center tags;
  `;

  const data = await tryOverpass(query);

  // ── 2. Map elements to vendor objects ──────────────────────────────────
  const vendors = data.elements
    .filter((el) => el.tags?.name)
    .map((el) => {
      const vlat = el.lat ?? el.center?.lat;
      const vlon = el.lon ?? el.center?.lon;
      if (vlat === undefined || vlon === undefined) return null;

      const tags = el.tags;
      const osmResult = getOsmImage(tags);
      const website = getBestWebsite(tags);

      return {
        id: `${el.type}-${el.id}`,
        name: tags.name,
        type,
        latitude: vlat,
        longitude: vlon,
        address:
          tags['addr:full'] ||
          [tags['addr:housenumber'], tags['addr:street']].filter(Boolean).join(' ') ||
          null,
        phone: tags.phone || tags['contact:phone'] || null,
        website,
        image: osmResult ? osmResult.url : null,
        _imageSource: osmResult ? osmResult.source : null,   // internal, stripped later
        distance: Number(
          calculateDistance(latitude, longitude, vlat, vlon).toFixed(2)
        ),
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.distance - b.distance);

  // ── 3. Enrich vendors via website scraping (bounded concurrency) ────────
  //
  //  Process ALL vendors that:
  //    - have no OSM image yet
  //    - have a website to scrape
  //
  //  Use a concurrency pool of 5 so we don't flood target servers.
  const vendorsToEnrich = vendors.filter((v) => !v.image && v.website);

  console.log(
    `\n[Vendor Search] type=${type} | total=${vendors.length} | ` +
    `osm_images=${vendors.filter((v) => v.image).length} | ` +
    `to_enrich=${vendorsToEnrich.length}\n`
  );

  const enrichThunks = vendorsToEnrich.map((vendor) => async () => {
    const result = await getWebsiteImage(vendor.website);
    if (result) {
      vendor.image = result.url;
      vendor._imageSource = result.source;
    }
  });

  await pLimit(enrichThunks, 5);   // max 5 concurrent website requests

  // ── 4. Log summary ──────────────────────────────────────────────────────
  console.log('\n── Image Summary ──────────────────────────────────────');
  vendors.forEach((v) => {
    const src = v._imageSource || 'none';
    console.log(`  ${v.name.padEnd(40)} | ${src}`);
    delete v._imageSource;   // don't expose internal field to frontend
  });
  console.log('────────────────────────────────────────────────────\n');

  return vendors;
};