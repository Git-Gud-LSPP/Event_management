import type { LucideIcon } from "lucide-react";
import {
  Accessibility, AlarmClock, Archive, Armchair, Award, BadgeCheck, BarChart3, Bell, BookOpen, Bus, CalendarCheck,
  CalendarClock, CalendarDays, CalendarRange, Captions, ChartLine, ChartPie, CircleDollarSign, ClipboardCheck,
  ClipboardList, CloudLightning, Code, Columns3, Contact, Copy, Crown, Download, FileBarChart,
  FileSignature, FileText, Flag, Flame, Gauge, Gift, Globe, Handshake, Heart, HeartPulse, Hotel, IdCard, KanbanSquare,
  Key, Landmark, Languages, LayoutTemplate, Leaf, Link, ListChecks, ListOrdered, Mail, Map, MapPin, Megaphone,
  MessageCircleQuestion, MessageSquare, Mic, Newspaper, Package, PackageSearch, PenTool, Percent, Play, Presentation,
  Printer, Radio, Receipt, ReceiptText, RefreshCw, Rss, ScanLine, Scale, ScrollText, Send, Share2, Shield, ShieldCheck,
  ShoppingCart, Signpost, Siren, Smartphone, Smile, Sparkles, Star, Store, Ticket, Timer, Trophy, Truck, UserCheck,
  UserPlus, Users, UsersRound, Utensils, Video, Vote, Wallet, Webhook, Workflow, Wrench,
} from "lucide-react";

// One icon per module id (see slug() in catalog.ts). Unknown ids fall back to a package.
const ICONS: Record<string, LucideIcon> = {
  events: CalendarDays, "my-tasks": KanbanSquare, "run-of-show": CalendarRange, documents: FileText,
  "agenda-builder": ListOrdered, "budget-planner": Wallet, approvals: BadgeCheck, "event-templates": Copy,
  milestones: Flag, "portfolio-view": Columns3,
  staff: Users, "shift-rostering": CalendarClock, "call-sheets": AlarmClock, volunteers: Heart, speakers: Mic,
  accreditation: IdCard, "time-tracking": Timer, briefings: ClipboardList, "contractor-onboarding": UserPlus,
  "guest-list-and-vip": Crown,
  "floor-plan": Map, inventory: Archive, "site-map": MapPin, "seating-charts": Armchair, "room-blocks": Hotel,
  transport: Bus, "load-in-planner": Truck, "equipment-rental": Wrench, signage: Signpost,
  "accessibility-planner": Accessibility, "catering-and-dietary": Utensils,
  vendors: Store, procurement: ShoppingCart, "purchase-orders": ReceiptText, "contracts-and-e-sign": FileSignature,
  "quote-comparison": Scale, payables: Landmark, expenses: Receipt, sponsorship: Handshake, "exhibitor-portal": Presentation,
  "budget-vs-actuals": ChartLine,
  ticketing: Ticket, "registration-forms": ClipboardCheck, "promo-codes": Percent, "group-bookings": UsersRound,
  waitlists: ListChecks, payments: CircleDollarSign, refunds: RefreshCw, "reserved-seating": Armchair, rsvp: CalendarCheck,
  abstracts: ScrollText,
  incidents: Siren, "check-in": ScanLine, "badge-printing": Printer, "live-cueing": Play, "channel-log": Radio,
  "lost-and-found": PackageSearch, "medical-log": HeartPulse, "crowd-counters": Gauge, "weather-alerts": CloudLightning,
  "safety-checklists": ShieldCheck,
  "attendee-app": Smartphone, networking: Share2, "live-qanda": MessageCircleQuestion, polls: Vote,
  "live-streaming": Video, "on-demand-video": Play, gamification: Trophy, "meeting-scheduler": Contact,
  "live-captions": Captions, "push-notifications": Bell,
  "email-campaigns": Mail, "event-website": Globe, "landing-pages": LayoutTemplate, sms: MessageSquare,
  "social-scheduler": Rss, referrals: Gift, "affiliate-tracking": Link, "wedding-website": Heart, invitations: Send,
  "webinar-reminders": Megaphone, "press-portal": Newspaper,
  analytics: BarChart3, surveys: Smile, nps: Star, "attendance-reports": FileBarChart, "sponsor-roi": Award,
  "financial-reports": ChartPie, "lead-retrieval": ScanLine, heatmaps: Flame, "custom-reports": PenTool,
  "data-export": Download, sustainability: Leaf,
  assistant: Sparkles, "crm-sync": Workflow, "calendar-sync": CalendarCheck, "slack-and-teams": MessageSquare,
  "webhooks-and-zapier": Webhook, "public-api": Code, "custom-roles": Shield, "multi-language": Languages,
  "sso-saml": Key, "scim-provisioning": UserCheck, "audit-log": BookOpen,
};

export const moduleIcon = (id: string): LucideIcon => ICONS[id] ?? Package;
