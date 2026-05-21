import * as XLSX from "xlsx";

const baseUrl = import.meta.env.VITE_Image_URL as string;

// ─── Cell types ───────────────────────────────────────────────────────────────

type CellValue = string | number | boolean | { f: string };

// ─── Shared interfaces ────────────────────────────────────────────────────────

interface SmartRack      { make?: string; serial_no?: string; type?: string; photo?: string }
interface FDMSShelf      { make?: string; serial_no?: string; count?: number | string; front_photo?: string; left_photo?: string; right_photo?: string; qr_photo?: string }
interface IPMPLSRouter   { make?: string; serial_no?: string; type?: string; photo?: string }
interface SFP            { make?: string; serial_no?: string; count?: number | string; photo?: string }
interface RFMS           { make?: string; serial_no?: string; count?: number | string; photo?: string }
interface PowerSystem    { available?: boolean; make?: string; serial_no?: string; battery_sno?: string; solar_pannel_sno?: string; ups_sno?: string; photo?: string }
interface Solar1KW       { make?: string; serial_no?: string; battery_sno?: string; solar_pannel_sno?: string; ups_sno?: string; photo?: string }
interface Earthpit       { capacity?: string; latitude?: string; longitude?: string; photo?: string }
interface Contact        { name?: string; email?: string; phone?: string }
interface KeyPerson      { name?: string; phone?: string }

// ─── Row interfaces ───────────────────────────────────────────────────────────

export interface GPInstallationRow {
  state_name?: string;           district_name?: string;
  block_name?: string;           gp_name?: string;
  gp_code?: string;              gp_latitude?: string | number;
  gp_longitude?: string | number;
  smart_rack?: SmartRack[] | string;
  fdms_shelf?: FDMSShelf[] | string;
  ip_mpls_router?: IPMPLSRouter | string;
  sfp_10g_40?: SFP[] | string;   sfp_1g_10?: SFP[] | string;    sfp_10g_10?: SFP[] | string;
  power_system_with_mppt?: PowerSystem | string;
  power_system_with_out_mppt?: PowerSystem | string;
  mppt_solar_1kw?: Solar1KW | string;
  equipment_photo?: string[] | string;
  electricity_meter?: string;    status?: string;
  earthpit?: Earthpit | string;
  gp_contact?: Contact | string; key_person?: KeyPerson | string;
  RFMS_FILTERS?: unknown;        created_at?: string;           updated_at?: string;
}

export interface BlockInstallationRow {
  state_name?: string;           state_code?: string;
  district_name?: string;        district_code?: string;
  block_code?: string;           block_name?: string;
  block_latitude?: string | number; block_longitude?: string | number;
  block_photos?: string[] | string;
  smart_rack?: SmartRack[] | string;
  fdms_shelf?: FDMSShelf[] | string;
  ip_mpls_router?: IPMPLSRouter | string;
  sfp_10g_40?: SFP[] | string;   sfp_1g_10?: SFP[] | string;    sfp_10g_10?: SFP[] | string;
  rfms?: RFMS[] | string;
  RFMS_FILTERS?: unknown;
  equipment_photo?: string[] | string;
  fiber_entry?: string[] | string;
  splicing_photo?: string[] | string;
  block_contacts?: Contact[] | string;
  status?: string;               created_at?: string;            updated_at?: string;
}

// ─── JSON helpers ─────────────────────────────────────────────────────────────

function safeParseJSON<T>(value: unknown): T | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "object") return value as T;
  if (typeof value === "string") {
    let s = value.trim();
    if (s.startsWith('"') && s.endsWith('"')) {
      try { s = JSON.parse(s) as string; } catch { /* ignore */ }
    }
    try { return JSON.parse(s) as T; } catch { return null; }
  }
  return null;
}

function listFirst<T>(value: unknown): T {
  const p = safeParseJSON<T[]>(value);
  return (Array.isArray(p) && p.length > 0 ? p[0] : {}) as T;
}

function asDict<T>(value: unknown): T {
  const p = safeParseJSON<T>(value);
  return (p && !Array.isArray(p) ? p : {}) as T;
}

function asStringList(value: unknown): string[] {
  const p = safeParseJSON<string[]>(value);
  return Array.isArray(p) ? p.filter((v) => typeof v === "string") : [];
}

// ─── Hyperlink helper ─────────────────────────────────────────────────────────

function photoLink(path: string | undefined): CellValue {
  if (!path) return "";
  const url = `${baseUrl}/${path}`.replace(/([^:])\/\//g, "$1/");
  return { f: `HYPERLINK("${url}","View Photo")` };
}

// Expand a photo-path list into N link cells (padded with "" if fewer photos)
function photoLinks(paths: string[], max: number): CellValue[] {
  return Array.from({ length: max }, (_, i) => photoLink(paths[i]));
}

// ─── Shared section builders ──────────────────────────────────────────────────
// Each builder returns [headers[], cells[]] so they stay in sync automatically.

function sharedEquipmentHeaders(): string[] {
  return [
    "Smart Rack - Make", "Smart Rack - Serial No", "Smart Rack - Type", "Smart Rack - Photo",
    "FDMS Shelf - Make", "FDMS Shelf - Serial No", "FDMS Shelf - Count",
    "FDMS Shelf - Front Photo", "FDMS Shelf - Left Photo", "FDMS Shelf - Right Photo", "FDMS Shelf - QR Photo",
    "IP MPLS Router - Make", "IP MPLS Router - Serial No", "IP MPLS Router - Type", "IP MPLS Router - Photo",
    "SFP 10G/40 - Make", "SFP 10G/40 - Serial No", "SFP 10G/40 - Count", "SFP 10G/40 - Photo",
    "SFP 1G/10 - Make",  "SFP 1G/10 - Serial No",  "SFP 1G/10 - Count",  "SFP 1G/10 - Photo",
    "SFP 10G/10 - Make", "SFP 10G/10 - Serial No", "SFP 10G/10 - Count", "SFP 10G/10 - Photo",
  ];
}

function sharedEquipmentCells(
  smart_rack: unknown,
  fdms_shelf: unknown,
  ip_mpls_router: unknown,
  sfp_10g_40: unknown,
  sfp_1g_10: unknown,
  sfp_10g_10: unknown
): CellValue[] {
  const sr   = listFirst<SmartRack>(smart_rack);
  const fdms = listFirst<FDMSShelf>(fdms_shelf);
  const mpls = asDict<IPMPLSRouter>(ip_mpls_router);
  const s40  = listFirst<SFP>(sfp_10g_40);
  const s1g  = listFirst<SFP>(sfp_1g_10);
  const s10  = listFirst<SFP>(sfp_10g_10);

  return [
    sr.make ?? "",   sr.serial_no ?? "",  sr.type ?? "",   photoLink(sr.photo),
    fdms.make ?? "", fdms.serial_no ?? "", fdms.count ?? "",
    photoLink(fdms.front_photo), photoLink(fdms.left_photo),
    photoLink(fdms.right_photo), photoLink(fdms.qr_photo),
    mpls.make ?? "", mpls.serial_no ?? "", mpls.type ?? "",  photoLink(mpls.photo),
    s40.make ?? "",  s40.serial_no ?? "",  s40.count ?? "",  photoLink(s40.photo),
    s1g.make ?? "",  s1g.serial_no ?? "",  s1g.count ?? "",  photoLink(s1g.photo),
    s10.make ?? "",  s10.serial_no ?? "",  s10.count ?? "",  photoLink(s10.photo),
  ];
}

// ─── GP: headers + flattener ──────────────────────────────────────────────────

const GP_HEADERS: string[] = [
  "State Name", "District Name", "Block Name", "GP Name", "GP Code", "GP Latitude", "GP Longitude",
  ...sharedEquipmentHeaders(),
  "Power MPPT - Available", "Power MPPT - Make", "Power MPPT - Serial No",
  "Power MPPT - Battery SNO", "Power MPPT - Solar Panel SNO", "Power MPPT - UPS SNO", "Power MPPT - Photo",
  "Power w/o MPPT - Available", "Power w/o MPPT - Make", "Power w/o MPPT - Serial No",
  "Power w/o MPPT - Battery SNO", "Power w/o MPPT - Solar Panel SNO", "Power w/o MPPT - UPS SNO", "Power w/o MPPT - Photo",
  "Solar 1KW - Make", "Solar 1KW - Serial No", "Solar 1KW - Battery SNO",
  "Solar 1KW - Solar Panel SNO", "Solar 1KW - UPS SNO", "Solar 1KW - Photo",
  "Equipment Photo 1", "Equipment Photo 2", "Equipment Photo 3", "Equipment Photo 4", "Equipment Photo 5",
  "Electricity Meter", "Status",
  "Earthpit - Capacity", "Earthpit - Latitude", "Earthpit - Longitude", "Earthpit - Photo",
  "GP Contact - Name", "GP Contact - Email", "GP Contact - Phone",
  "Key Person - Name", "Key Person - Phone",
  "Created At", "Updated At",
];

function flattenGPRow(row: GPInstallationRow): CellValue[] {
  const pmppt   = asDict<PowerSystem>(row.power_system_with_mppt);
  const pwout   = asDict<PowerSystem>(row.power_system_with_out_mppt);
  const solar   = asDict<Solar1KW>(row.mppt_solar_1kw);
  const earth   = asDict<Earthpit>(row.earthpit);
  const contact = asDict<Contact>(row.gp_contact);
  const kp      = asDict<KeyPerson>(row.key_person);

  return [
    row.state_name ?? "", row.district_name ?? "", row.block_name ?? "",
    row.gp_name ?? "", row.gp_code ?? "", row.gp_latitude ?? "", row.gp_longitude ?? "",
    ...sharedEquipmentCells(
      row.smart_rack, row.fdms_shelf, row.ip_mpls_router,
      row.sfp_10g_40, row.sfp_1g_10, row.sfp_10g_10
    ),
    // Power MPPT
    pmppt.available ?? "", pmppt.make ?? "", pmppt.serial_no ?? "",
    pmppt.battery_sno ?? "", pmppt.solar_pannel_sno ?? "", pmppt.ups_sno ?? "", photoLink(pmppt.photo),
    // Power w/o MPPT
    pwout.available ?? "", pwout.make ?? "", pwout.serial_no ?? "",
    pwout.battery_sno ?? "", pwout.solar_pannel_sno ?? "", pwout.ups_sno ?? "", photoLink(pwout.photo),
    // Solar 1KW
    solar.make ?? "", solar.serial_no ?? "", solar.battery_sno ?? "",
    solar.solar_pannel_sno ?? "", solar.ups_sno ?? "", photoLink(solar.photo),
    // Equipment Photos
    ...photoLinks(asStringList(row.equipment_photo), 5),
    // Misc
    row.electricity_meter ?? "", row.status ?? "PENDING",
    // Earthpit
    earth.capacity ?? "", earth.latitude ?? "", earth.longitude ?? "", photoLink(earth.photo),
    // Contacts
    contact.name ?? "", contact.email ?? "", contact.phone ?? "",
    kp.name ?? "", kp.phone ?? "",
    row.created_at ?? "", row.updated_at ?? "",
  ];
}

// ─── Block: headers + flattener ───────────────────────────────────────────────

const BLOCK_HEADERS: string[] = [
  "State Name", "State Code", "District Name", "District Code",
  "Block Code", "Block Name", "Block Latitude", "Block Longitude",
  "Block Photo 1", "Block Photo 2", "Block Photo 3", "Block Photo 4", "Block Photo 5",
  ...sharedEquipmentHeaders(),
  "RFMS - Make", "RFMS - Serial No", "RFMS - Count", "RFMS - Photo",
  "Equipment Photo 1", "Equipment Photo 2", "Equipment Photo 3", "Equipment Photo 4", "Equipment Photo 5",
  "Fiber Entry Photo 1", "Fiber Entry Photo 2", "Fiber Entry Photo 3", "Fiber Entry Photo 4", "Fiber Entry Photo 5",
  "Splicing Photo 1", "Splicing Photo 2", "Splicing Photo 3", "Splicing Photo 4", "Splicing Photo 5",
  "Block Contact - Name", "Block Contact - Email", "Block Contact - Phone",
  "Status", "Created At", "Updated At",
];

function flattenBlockRow(row: BlockInstallationRow): CellValue[] {
  const rfms    = listFirst<RFMS>(row.rfms);
  const contact = listFirst<Contact>(row.block_contacts);

  return [
    row.state_name ?? "", row.state_code ?? "", row.district_name ?? "", row.district_code ?? "",
    row.block_code ?? "", row.block_name ?? "", row.block_latitude ?? "", row.block_longitude ?? "",
    // Block Photos
    ...photoLinks(asStringList(row.block_photos), 5),
    ...sharedEquipmentCells(
      row.smart_rack, row.fdms_shelf, row.ip_mpls_router,
      row.sfp_10g_40, row.sfp_1g_10, row.sfp_10g_10
    ),
    // RFMS
    rfms.make ?? "", rfms.serial_no ?? "", rfms.count ?? "", photoLink(rfms.photo),
    // Equipment / Fiber / Splicing Photos
    ...photoLinks(asStringList(row.equipment_photo), 5),
    ...photoLinks(asStringList(row.fiber_entry), 5),
    ...photoLinks(asStringList(row.splicing_photo), 5),
    // Contact
    contact.name ?? "", contact.email ?? "", contact.phone ?? "",
    row.status ?? "PENDING", row.created_at ?? "", row.updated_at ?? "",
  ];
}

// ─── Generic worksheet builder ────────────────────────────────────────────────

function buildWorksheet<T>(
  data: T[],
  headers: string[],
  flattener: (row: T) => CellValue[]
): XLSX.WorkSheet {
  const ws = XLSX.utils.aoa_to_sheet([headers, ...data.map(flattener)]);
  ws["!cols"] = headers.map((h) => ({ wch: Math.min(Math.max(h.length + 2, 14), 40) }));
  ws["!freeze"] = { xSplit: 0, ySplit: 1 };
  return ws;
}

// ─── Public export functions ──────────────────────────────────────────────────

export async function exportGPInstallationExcel(
  filteredData: GPInstallationRow[],
  onComplete?: () => void,
  setLoading?: (v: boolean) => void
): Promise<void> {
  if (!filteredData?.length) return;
  setLoading?.(true);
  try {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, buildWorksheet(filteredData, GP_HEADERS, flattenGPRow), "GP Installation");
    XLSX.writeFile(wb, "GP_Installation_Data.xlsx", { compression: true });
    onComplete?.();
  } finally {
    setLoading?.(false);
  }
}

export async function exportBlockInstallationExcel(
  filteredData: BlockInstallationRow[],
  onComplete?: () => void,
  setLoading?: (v: boolean) => void
): Promise<void> {
  if (!filteredData?.length) return;
  setLoading?.(true);
  try {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, buildWorksheet(filteredData, BLOCK_HEADERS, flattenBlockRow), "Block Installation");
    XLSX.writeFile(wb, "Block_Installation_Data.xlsx", { compression: true });
    onComplete?.();
  } finally {
    setLoading?.(false);
  }
}