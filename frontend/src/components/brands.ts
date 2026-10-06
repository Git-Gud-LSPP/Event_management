import type { IconType } from "react-icons";
import { FaLinkedin, FaMicrosoft, FaSalesforce, FaSlack } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { PiMicrosoftOutlookLogo, PiMicrosoftTeamsLogo } from "react-icons/pi";
import {
  SiAdyen, SiGooglebigquery, SiGooglecalendar, SiHubspot, SiMailchimp, SiOkta, SiSnowflake, SiStripe, SiWebex, SiZapier, SiZoom,
} from "react-icons/si";
import { TbBrandAdobe } from "react-icons/tb";
import { VscAzure } from "react-icons/vsc";

// Real brand marks keyed by display name. Missing names (Pipedrive, Segment) fall back to initials at the call site.
export const BRANDS: Record<string, { Icon: IconType; color?: string }> = {
  Salesforce: { Icon: FaSalesforce, color: "#00A1E0" },
  HubSpot: { Icon: SiHubspot, color: "#FF7A59" },
  Zoom: { Icon: SiZoom, color: "#0B5CFF" },
  Stripe: { Icon: SiStripe, color: "#635BFF" },
  Slack: { Icon: FaSlack, color: "#4A154B" },
  Marketo: { Icon: TbBrandAdobe, color: "#EB1000" },
  "Microsoft Teams": { Icon: PiMicrosoftTeamsLogo, color: "#6264A7" },
  "Google Calendar": { Icon: SiGooglecalendar, color: "#4285F4" },
  Zapier: { Icon: SiZapier, color: "#FF4F00" },
  Okta: { Icon: SiOkta, color: "#007DC1" },
  Snowflake: { Icon: SiSnowflake, color: "#29B5E8" },
  Mailchimp: { Icon: SiMailchimp, color: "#241C15" },
  Adyen: { Icon: SiAdyen, color: "#0ABF53" },
  "Microsoft Dynamics": { Icon: FaMicrosoft, color: "#0078D4" },
  LinkedIn: { Icon: FaLinkedin, color: "#0A66C2" },
  BigQuery: { Icon: SiGooglebigquery, color: "#4285F4" },
  Webex: { Icon: SiWebex, color: "#07C160" },
  "Azure AD": { Icon: VscAzure, color: "#0078D4" },
  Google: { Icon: FcGoogle }, // multicolour mark, no tint
  Microsoft: { Icon: FaMicrosoft, color: "#00A4EF" },
  Outlook: { Icon: PiMicrosoftOutlookLogo, color: "#0078D4" },
};
