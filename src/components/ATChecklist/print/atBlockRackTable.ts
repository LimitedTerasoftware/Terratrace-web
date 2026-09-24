// Section 3.1 "Test cases for Block Rack" as laid out in the filled reference document
// (107398.pdf, ABP/AT/BLRK/002 Ver1.0): one entry per landscape page, one row per table
// row on that page, with the rules (`top`/`bottom`), column boundaries (`cols`) and every
// text line (text, baseline y, x, horizontal scale) in pt from the page's top-left corner.
// Columns 0-5 are template text; "Compliance (Y/N)" and "Remarks" hold the entered values.
// `rowspan` marks vertically merged cells; `null` is a cell covered by a merge above.

export type RackLine = [text: string, baseline: number, x: number, scale: number];

export interface RackCell {
  rowspan?: number;
  lines: RackLine[];
}

export interface RackRow {
  header?: boolean;
  test?: string; // checklist test id (T1..T27) whose values go in this row
  top: number;
  bottom: number;
  cells: (RackCell | null)[];
}

export interface RackTablePage {
  cols: number[];
  rows: RackRow[];
}

export const RACK_TABLE_PAGES: RackTablePage[] = [
  // Page 5
  {
    cols: [17.52, 63.72, 145.1, 270.17, 412.01, 537.19, 680.5, 762.24, 830.52],
    rows: [
      { header: true, top: 97.58, bottom: 130.94, cells: [
        { lines: [['Test', 111.26, 27.36, 1.16], ['Cases', 125.42, 23.28, 1.16]] },
        { lines: [['RFP Clause', 118.46, 69.36, 1.16]] },
        { lines: [['Test Description', 118.46, 156.38, 1.1]] },
        { lines: [['Test Parameters', 118.46, 290.81, 1.1]] },
        { lines: [['Test Procedure', 118.46, 427.87, 1.1]] },
        { lines: [['Test Result', 118.46, 573.55, 1.16]] },
        { lines: [['Complianc', 111.26, 689.86, 1.1], ['e (Y/N)', 125.42, 701.62, 1.1]] },
        { lines: [['Remark', 111.26, 771.36, 1.1], ['s', 125.42, 792.48, 1.1]] },
      ] },
      { test: 'T1', top: 130.94, bottom: 211.25, cells: [
        { lines: [['T-1', 186.77, 32.4, 1.04]] },
        { lines: [['Sec-IV-C,', 180.41, 81.02, 1.15], ['Anx-B (VI.1)', 193.37, 71.16, 1.15]] },
        { lines: [['Outdoor/Indoor', 141.86, 145.34, 1.0], ['enclosure for DC Power', 154.7, 145.34, 1.0], ['Plant/AC UPS and Other', 167.69, 145.34, 1.0], ['Network Equipment', 180.53, 145.34, 1.0]] },
        { lines: [['Check both network and', 141.86, 270.41, 1.0], ['power supply including', 154.7, 270.41, 1.0], ['battery with partitions for', 167.69, 270.41, 1.0], ['power, battery bank and', 180.53, 270.41, 1.0], ['network devices are placed in', 193.49, 270.41, 1.0], ['single enclosure.', 206.33, 270.41, 1.0]] },
        { lines: [['To be checked Physically', 141.86, 412.25, 1.0], ['as per approved Rack', 154.7, 412.25, 1.0], ['Layout Plan', 167.69, 412.25, 1.0]] },
        { lines: [['All the equipment is arranged', 167.69, 537.31, 1.0], ['as per layout plan', 180.53, 537.31, 1.0]] },
      ] },
      { test: 'T2', top: 211.25, bottom: 265.73, cells: [
        { lines: [['T-2', 247.73, 32.4, 1.04]] },
        { lines: [['Sec-IV-C,', 241.25, 81.02, 1.15], ['Anx-B (VI.2)', 254.21, 71.16, 1.15]] },
        { lines: [['Technical Requirement', 234.89, 145.34, 1.0]] },
        { lines: [['All enclosure panels are', 221.93, 270.41, 1.0], ['single walled boltable from', 234.89, 270.41, 1.0], ['inside with earthing to be', 247.73, 270.41, 1.0], ['done on all at parts.', 260.57, 270.41, 1.0]] },
        { lines: [['Earthing Strip & wires', 221.93, 412.25, 1.0], ['should be properly fixed', 234.89, 412.25, 1.0], ['with all the equipment.', 247.73, 412.25, 1.0]] },
        { lines: [['Earthing is connected for all', 234.89, 537.31, 1.0], ['the equipment', 247.73, 537.31, 1.0]] },
      ] },
      { test: 'T3', top: 265.73, bottom: 346.27, cells: [
        { lines: [['T-3', 321.43, 32.4, 1.04]] },
        { lines: [['Sec-IV-C,', 314.95, 81.02, 1.15], ['Anx-B (VI.3)', 327.79, 71.16, 1.15]] },
        { lines: [['Enclosure Frame Material:', 315.07, 145.34, 1.0]] },
        { lines: [['Zinc magnesium coating with', 276.41, 270.41, 1.0], ['25mm system punching in', 289.27, 270.41, 1.0], ['the roof and base frame plus', 302.23, 270.41, 1.0], ['vertical sections with two', 315.07, 270.41, 1.0], ['mounting levels, rolled out of', 328.03, 270.41, 1.0], ['a single sheet,', 340.87, 270.41, 1.0]] },
        { lines: [['To be checked Physically', 302.23, 412.25, 1.0], ['and OEM QA Certificate to', 315.07, 412.25, 1.0], ['be taken for material', 328.03, 412.25, 1.0]] },
        { lines: [['Cross checked with OEM QA', 315.07, 537.31, 1.0], ['certificate', 328.03, 537.31, 1.0]] },
      ] },
      { test: 'T4', top: 346.27, bottom: 396.34, cells: [
        { lines: [['T-4', 369.55, 32.4, 1.04]] },
        { rowspan: 2, lines: [['Sec-IV-C,', 382.75, 81.02, 1.15], ['Anx-B (VI.4)', 395.74, 71.16, 1.15]] },
        { rowspan: 2, lines: [['Enclosure Flat Parts', 382.75, 145.34, 1.0], ['Material:', 395.62, 145.34, 1.0]] },
        { lines: [['Galvanized sheet steel', 356.95, 270.41, 1.0], ['1.5mm/2mm thick of', 369.91, 270.41, 1.0], ['120GSM/', 382.75, 270.41, 1.0]] },
        { lines: [['OEM QA Certificate to be', 356.95, 412.25, 1.0], ['taken', 369.91, 412.25, 1.0]] },
        { lines: [['Cross checked with OEM QA', 356.95, 537.31, 1.0], ['certificate', 369.91, 537.31, 1.0]] },
      ] },
      { test: 'T5', top: 396.34, bottom: 435.7, cells: [
        { lines: [['T-5', 419.86, 32.4, 1.04]] },
        null,
        null,
        { lines: [['Front single door with 4-', 407.02, 270.41, 1.0], ['point locking system and rear', 419.86, 270.41, 1.0], ['panel boltable', 432.82, 270.41, 1.0]] },
        { lines: [['To be checked Physically', 407.02, 412.25, 1.0]] },
        { lines: [['Locking system and', 407.02, 537.31, 1.0], ['door arrangement checked', 419.86, 537.31, 1.0]] },
      ] },
    ],
  },
  // Page 6
  {
    cols: [17.52, 63.72, 145.1, 270.17, 412.01, 537.19, 680.5, 764.76, 830.52],
    rows: [
      { header: true, top: 54.5, bottom: 87.86, cells: [
        { lines: [['Test', 68.18, 27.36, 1.16], ['Cases', 82.34, 23.28, 1.16]] },
        { lines: [['RFP Clause', 75.38, 69.36, 1.16]] },
        { lines: [['Test Description', 75.38, 156.38, 1.1]] },
        { lines: [['Test Parameters', 75.38, 290.81, 1.1]] },
        { lines: [['Test Procedure', 75.38, 427.87, 1.1]] },
        { lines: [['Test Result', 75.38, 574.27, 1.16]] },
        { lines: [['Complianc', 68.18, 689.86, 1.1], ['e (Y/N)', 82.34, 701.62, 1.1]] },
        { lines: [['Remark', 68.18, 773.88, 1.1], ['s', 82.34, 795.0, 1.1]] },
      ] },
      { top: 87.86, bottom: 153.14, cells: [
        { lines: [] },
        { rowspan: 3, lines: [] },
        { rowspan: 3, lines: [] },
        { lines: [['from inside in single walled', 98.78, 270.41, 1.0], ['construction with door stay,', 111.74, 270.41, 1.0], ['Side panels left and right in', 124.58, 270.41, 1.0], ['single walled construction', 137.54, 270.41, 1.0], ['boltable from inside,', 150.38, 270.41, 1.0]] },
        { lines: [] },
        { lines: [] },
      ] },
      { test: 'T6', top: 153.14, bottom: 205.25, cells: [
        { lines: [['T-6', 189.65, 32.4, 1.04]] },
        null,
        null,
        { lines: [['Rain canopy of 75mm height', 163.82, 270.41, 1.0], ['with projection all around,', 176.69, 270.41, 1.0], ['with 300mm base plinth of', 189.65, 270.41, 1.0], ['3mm thick,', 202.49, 270.41, 1.0]] },
        { lines: [['OEM QA Certificate to be', 176.69, 412.25, 1.0], ['taken', 189.65, 412.25, 1.0]] },
        { lines: [['Cross checked with OEM QA', 176.69, 537.31, 1.0], ['certificate', 189.65, 537.31, 1.0]] },
      ] },
      { test: 'T7', top: 205.25, bottom: 283.51, cells: [
        { lines: [['T-7', 254.69, 32.4, 1.04]] },
        null,
        null,
        { lines: [['The enclosure flat parts to be', 215.93, 270.41, 1.0], ['gasketed with Outdoor', 228.77, 270.41, 1.0], ['Polyurethane foam gasket,', 241.73, 270.41, 1.0], ['the fasteners will be of SS304', 254.57, 270.41, 1.0], ['grade suitable for outdoor', 267.53, 270.41, 1.0], ['application.', 280.39, 270.41, 1.0]] },
        { lines: [['OEM QA Certificate to be', 241.73, 412.25, 1.0], ['taken', 254.57, 412.25, 1.0]] },
        { lines: [['Physically checked & OEM QA', 241.73, 537.31, 1.0], ['certificate collected', 254.57, 537.31, 1.0]] },
      ] },
      { test: 'T8', top: 283.51, bottom: 322.87, cells: [
        { lines: [['T-8', 307.03, 32.4, 1.04]] },
        { lines: [['Sec-IV-C,', 300.55, 81.02, 1.15], ['Anx-B (VI.5)', 313.51, 71.16, 1.15]] },
        { lines: [['Dimension:', 294.19, 145.34, 1.0]] },
        { lines: [['Provision for minimum 20%', 294.19, 270.41, 1.0], ['additional space for future', 307.15, 270.41, 1.0], ['expansion.', 319.99, 270.41, 1.0]] },
        { lines: [['To be checked Physically', 294.19, 412.25, 1.0]] },
        { lines: [['Physically checked', 294.19, 537.31, 1.0]] },
      ] },
      { test: 'T9', top: 322.87, bottom: 405.22, cells: [
        { lines: [['T-9', 378.55, 32.4, 1.04]] },
        { lines: [['Sec-IV-B,', 372.07, 79.46, 1.15], ['SCC, 3.9(i)', 385.03, 75.84, 1.21]] },
        { lines: [['Mini OLT Space', 359.35, 145.34, 1.0], ['provisioning', 372.31, 145.34, 1.0]] },
        { lines: [['1U Space to be available in', 333.55, 270.41, 1.0], ['rack for future OLT', 346.51, 270.41, 1.0], ['provisioning and power to', 359.35, 270.41, 1.0], ['the OLT to be tapped from the', 372.31, 270.41, 1.0], ['Power System being procured', 385.15, 270.41, 1.0], ['at the GP location.', 398.14, 270.41, 1.0]] },
        { lines: [['Space and power', 359.35, 412.25, 1.0], ['provisioning to be', 372.31, 412.25, 1.0], ['checked Physically.', 385.15, 412.25, 1.0]] },
        { lines: [['Physically checked', 372.31, 537.31, 1.0]] },
      ] },
    ],
  },
  // Page 7
  {
    cols: [17.52, 63.72, 145.1, 270.17, 412.01, 537.19, 672.22, 757.8, 830.52],
    rows: [
      { header: true, top: 50.04, bottom: 83.3, cells: [
        { lines: [['Test', 63.74, 27.36, 1.16], ['Cases', 77.9, 23.28, 1.16]] },
        { lines: [['RFP Clause', 70.94, 69.36, 1.16]] },
        { lines: [['Test Description', 70.94, 156.38, 1.1]] },
        { lines: [['Test Parameters', 70.94, 291.05, 1.1]] },
        { lines: [['Test Procedure', 70.94, 427.87, 1.1]] },
        { lines: [['Test Result', 70.94, 573.55, 1.16]] },
        { lines: [['Compliance', 63.74, 681.58, 1.1], ['(Y/N)', 77.9, 693.34, 1.1]] },
        { lines: [['Remark s', 63.74, 766.92, 1.1]] },
      ] },
      { test: 'T10', top: 83.3, bottom: 174.41, cells: [
        { lines: [['T-10', 132.86, 28.92, 1.04]] },
        { rowspan: 6, lines: [['Sec-IV-C,', 237.29, 81.02, 1.15], ['Anx-B (VI.6)', 250.13, 71.16, 1.15]] },
        { rowspan: 6, lines: [['Cooling:', 236.21, 145.34, 1.15]] },
        { lines: [['The housing should be', 94.34, 270.41, 1.15], ['equipped with DC/AC', 107.18, 270.41, 1.15], ['operated cooling Axial', 120.14, 270.41, 1.15], ['Fans, self- starting, double', 132.98, 270.41, 1.15], ['ball-bearing, temperature-', 145.94, 270.41, 1.09], ['controlled operation via', 158.78, 270.41, 1.09], ['controller.', 171.77, 270.41, 1.09]] },
        { lines: [['To be checked', 94.34, 412.25, 1.15], ['Physically and', 107.18, 412.25, 1.15], ['required OEM QA', 120.14, 412.25, 1.15], ['certificate for fan &', 132.98, 412.25, 1.15], ['controller', 145.94, 412.25, 1.15], ['functionality.', 158.78, 412.25, 1.15]] },
        { lines: [['Physically checked &', 107.18, 537.31, 1.15], ['OEM QA certificate', 120.14, 537.31, 1.15], ['collected', 132.98, 537.31, 1.15]] },
      ] },
      { test: 'T11', top: 174.41, bottom: 200.81, cells: [
        { lines: [['T-11', 191.45, 28.92, 1.04]] },
        null,
        null,
        { lines: [['Noise level maximum 65dB.', 185.09, 270.41, 1.0]] },
        { lines: [['To be checked with Sound', 185.09, 412.25, 1.0], ['Level Meter', 198.05, 412.25, 1.0]] },
        { lines: [['Noise is in the limit', 185.09, 537.31, 1.09]] },
      ] },
      { test: 'T12', top: 200.81, bottom: 256.13, cells: [
        { lines: [['T-12', 237.17, 28.92, 1.04]] },
        null,
        null,
        { lines: [['The cooling fans should be on', 211.49, 270.41, 1.0], ['a fan tray for ease of access', 224.45, 270.41, 1.0], ['and easy fault identification', 237.29, 270.41, 1.0], ['and diagnosis.', 250.25, 270.41, 1.0]] },
        { lines: [['Accessibility to be', 211.49, 412.25, 1.0], ['checked Physically and', 224.45, 412.25, 1.0], ['Parameters to be checked', 237.29, 412.25, 1.0], ['at SNOC', 250.25, 412.25, 1.0]] },
        { lines: [['Checked physically and', 224.45, 537.31, 1.15], ['through SNOC', 237.29, 537.31, 1.15]] },
      ] },
      { test: 'T13', top: 256.13, bottom: 275.81, cells: [
        { lines: [['T-13', 273.17, 28.92, 1.04]] },
        null,
        null,
        { lines: [['N+1 Configuration fans.', 266.81, 270.41, 1.15]] },
        { lines: [['To be checked Physically', 266.81, 412.25, 1.0]] },
        { lines: [['Redundant fan available', 266.81, 537.31, 1.15]] },
      ] },
      { test: 'T14', top: 275.81, bottom: 315.07, cells: [
        { lines: [['T-14', 299.23, 28.92, 1.04]] },
        null,
        null,
        { lines: [['The enclosure should have', 286.63, 270.41, 1.09], ['provision to mount Outlet', 299.47, 270.41, 1.09], ['filters:', 312.43, 270.41, 1.15]] },
        { lines: [['To be checked Physically', 286.63, 412.25, 1.0]] },
        { lines: [['Physically checked', 286.63, 537.31, 1.15]] },
      ] },
      { test: 'T15', top: 315.07, bottom: 367.15, cells: [
        { lines: [['T-15', 351.55, 28.92, 1.04]] },
        null,
        null,
        { lines: [['Material: ABS/PU, For', 325.75, 270.41, 1.0], ['ventilation by convection size', 338.71, 270.41, 1.0], ['and capacity as per heat load', 351.55, 270.41, 1.0], ['requirement.', 364.51, 270.41, 1.0]] },
        { lines: [['OEM QA Certificate to be', 338.71, 412.25, 1.0], ['taken', 351.55, 412.25, 1.0]] },
        { lines: [['Cross checked with OEM', 338.71, 537.31, 1.15], ['QA certificate', 351.55, 537.31, 1.15]] },
      ] },
      { test: 'T16', top: 367.15, bottom: 436.54, cells: [
        { lines: [['T-16', 410.14, 28.92, 1.04]] },
        { lines: [['Sec-IV-C,', 403.66, 81.02, 1.15], ['Anx-B (VI.8)', 416.62, 71.16, 1.15]] },
        { lines: [['Surface Finishing:', 403.66, 145.34, 1.15]] },
        { lines: [['Powder coated with UV', 377.83, 270.41, 1.0], ['Resistant pure polyester', 390.79, 270.41, 1.0], ['RAL7035 Matt super durable', 403.66, 270.41, 1.0], ['with painting thickness of 80', 416.62, 270.41, 1.0], ['to 120 microns minimum.', 429.46, 270.41, 1.0]] },
        { lines: [['OEM QA Certificate to be', 390.79, 412.25, 1.0], ['taken', 403.66, 412.25, 1.0]] },
        { lines: [['Cross checked with OEM QA', 390.79, 537.31, 1.0], ['certificate', 403.66, 537.31, 1.0]] },
      ] },
    ],
  },
  // Page 8
  {
    cols: [17.52, 63.72, 145.1, 270.17, 412.01, 537.19, 672.22, 757.8, 830.52],
    rows: [
      { header: true, top: 50.04, bottom: 83.3, cells: [
        { lines: [['Test', 63.74, 27.36, 1.16], ['Cases', 77.9, 23.28, 1.16]] },
        { lines: [['RFP Clause', 70.94, 69.36, 1.16]] },
        { lines: [['Test Description', 70.94, 156.38, 1.1]] },
        { lines: [['Test Parameters', 70.94, 290.81, 1.1]] },
        { lines: [['Test Procedure', 70.94, 427.87, 1.1]] },
        { lines: [['Test Result', 70.94, 573.55, 1.16]] },
        { lines: [['Compliance', 63.74, 681.58, 1.1], ['(Y/N)', 77.9, 693.34, 1.1]] },
        { lines: [['Remark s', 63.74, 766.92, 1.1]] },
      ] },
      { test: 'T17', top: 83.3, bottom: 292.39, cells: [
        { lines: [['T-17', 223.37, 28.92, 1.04]] },
        { rowspan: 2, lines: [['Sec-IV-C,', 268.73, 81.02, 1.15], ['Anx-B (VI.9)', 281.71, 71.16, 1.15]] },
        { rowspan: 2, lines: [['Access Control and', 268.73, 150.98, 1.15], ['Monitoring System:', 281.71, 150.98, 1.15]] },
        { lines: [['Electromagnetic spring-', 94.34, 270.41, 1.0], ['loaded metal lock with 9-digit', 107.18, 270.41, 1.0], ['electronic keypad reader for', 120.14, 270.41, 1.0], ['front door with', 132.98, 270.41, 1.0], ['IP/SNMP/Web browser-', 145.94, 270.41, 1.0], ['based control and monitoring', 158.78, 270.41, 1.0], ['to SNOC along with', 171.77, 270.41, 1.0], ['temperature, humidity, water', 184.61, 270.41, 1.0], ['logging, fan fail, water leakage', 197.57, 270.41, 1.0], ['from top, Fire detection, door', 210.41, 270.41, 1.0], ['open/unauthorized access', 223.25, 270.41, 1.0], ['monitoring to manage the', 236.21, 270.41, 1.0], ['SLA, Enclosure, Fan and', 249.05, 270.41, 1.0], ['Filter, locking and Monitoring', 262.01, 270.41, 1.0], ['system should be from the', 274.85, 270.41, 1.0], ['same OEM.', 287.83, 270.41, 1.0]] },
        { lines: [['Availability of lock to be', 184.61, 412.25, 1.0], ['checked Physically and', 197.57, 412.25, 1.0], ['Parameters to be checked', 210.41, 412.25, 1.0], ['at SNOC', 223.25, 412.25, 1.0]] },
        { lines: [['Checked physically and', 210.41, 537.31, 1.0], ['through SNOC', 223.25, 537.31, 1.0]] },
      ] },
      { test: 'T18', top: 292.39, bottom: 373.87, cells: [
        { lines: [['T-18', 348.07, 28.92, 1.04]] },
        null,
        null,
        { lines: [['Monitoring of major', 303.07, 270.41, 1.0], ['parameters including Input &', 316.03, 270.41, 1.0], ['Output Voltages, Inside &', 328.87, 270.41, 1.0], ['Outside Temperature,', 341.83, 270.41, 1.0], ['Humidity, Alarms, %battery', 354.67, 270.41, 1.0], ['backup time left.', 367.63, 270.41, 1.0]] },
        { lines: [['To be Checked at SNOC', 328.87, 412.25, 1.0]] },
        { lines: [['Checked at SNOC', 341.83, 537.31, 1.0]] },
      ] },
    ],
  },
  // Page 9
  {
    cols: [17.52, 63.72, 145.1, 270.17, 412.01, 537.19, 680.5, 764.76, 830.52],
    rows: [
      { header: true, top: 50.04, bottom: 83.3, cells: [
        { lines: [['Test', 63.74, 27.36, 1.16], ['Cases', 77.9, 23.28, 1.16]] },
        { lines: [['RFP Clause', 70.94, 69.36, 1.16]] },
        { lines: [['Test Description', 70.94, 156.38, 1.1]] },
        { lines: [['Test Parameters', 70.94, 290.81, 1.1]] },
        { lines: [['Test Procedure', 70.94, 427.87, 1.1]] },
        { lines: [['Test Result', 70.94, 573.55, 1.16]] },
        { lines: [['Complianc', 63.74, 689.86, 1.1], ['e (Y/N)', 77.9, 701.62, 1.1]] },
        { lines: [['Remark', 63.74, 773.88, 1.1], ['s', 77.9, 795.0, 1.1]] },
      ] },
      { test: 'T19', top: 83.3, bottom: 139.34, cells: [
        { lines: [['T-19', 126.26, 28.92, 1.04]] },
        { rowspan: 2, lines: [] },
        { rowspan: 2, lines: [] },
        { lines: [['Control/switch on/off Non-', 94.34, 270.41, 1.0], ['Critical Loads/Extra fans. The', 107.18, 270.41, 1.0], ['monitor & Control should be', 120.14, 270.41, 1.0], ['possible from SNOC.', 132.98, 270.41, 1.0]] },
        { lines: [['To be Checked at SNOC', 107.18, 412.25, 1.0]] },
        { lines: [['Checked at SNOC', 120.14, 537.31, 1.0]] },
      ] },
      { test: 'T20', top: 139.34, bottom: 180.29, cells: [
        { lines: [['T-20', 169.13, 28.92, 1.04]] },
        null,
        null,
        { lines: [['Last 24hrs (at least) Alarm &', 150.02, 270.41, 1.0], ['Access events must be stored', 162.98, 270.41, 1.0], ['with Date & Time stamp.', 175.85, 270.41, 1.0]] },
        { lines: [['SNOC Report to be', 150.02, 412.25, 1.0], ['provided by PIA', 162.98, 412.25, 1.0]] },
        { lines: [['SNOC report collected', 162.98, 537.31, 1.0]] },
      ] },
      { test: 'T21', top: 180.29, bottom: 272.57, cells: [
        { lines: [['T-21', 242.33, 28.92, 1.04]] },
        { rowspan: 2, lines: [['Sec-IV-C,', 261.89, 81.02, 1.15], ['Anx-B', 274.85, 88.58, 1.15], ['(VI.10)', 287.71, 88.7, 1.0]] },
        { rowspan: 2, lines: [['Temperature based', 268.49, 150.98, 1.09], ['fan operation', 281.23, 150.98, 1.09]] },
        { lines: [['The fans will be in 5+1', 191.09, 270.41, 1.0], ['configuration and 3 fans will', 203.93, 270.41, 1.0], ['operate when inside', 216.89, 270.41, 1.0], ['temperature is above 25°C, 2', 229.73, 270.41, 1.0], ['more fans will start operating', 242.57, 270.41, 1.0], ['automatically when inside', 255.53, 270.41, 1.0], ['temperature exceeds 35°C.', 268.37, 270.41, 1.0]] },
        { lines: [['Functionality to be', 216.89, 412.25, 1.0], ['checked with external', 229.73, 412.25, 1.0], ['blower', 242.57, 412.25, 1.0]] },
        { lines: [['Physically checked', 229.73, 537.31, 1.0]] },
      ] },
      { test: 'T22', top: 272.57, bottom: 326.59, cells: [
        { lines: [['T-22', 309.07, 28.92, 1.04]] },
        null,
        null,
        { lines: [['Standby fan operates', 283.27, 270.41, 1.0], ['automatically when inside', 296.23, 270.41, 1.0], ['temperature exceeds 60°C OR', 309.07, 270.41, 1.0], ['any of the fans fails.', 322.03, 270.41, 1.0]] },
        { lines: [['Functionality to be', 283.27, 412.25, 1.0], ['checked with external', 296.23, 412.25, 1.0], ['blower', 309.07, 412.25, 1.0]] },
        { lines: [['Physically checked', 296.23, 537.31, 1.0]] },
      ] },
      { test: 'T23', top: 326.59, bottom: 365.95, cells: [
        { lines: [['T-23', 350.11, 28.92, 1.04]] },
        { lines: [['Sec-IV-C,', 337.03, 81.02, 1.15], ['Anx-B', 350.23, 88.58, 1.15], ['(VI.11)', 363.19, 88.7, 1.0]] },
        { lines: [['Hidden camera', 350.11, 150.98, 1.15]] },
        { lines: [['A hidden tamper proof', 337.27, 270.41, 1.0], ['camera available and found in', 350.23, 270.41, 1.0], ['good condition', 363.07, 270.41, 1.0]] },
        { lines: [['To be checked Physically', 337.27, 412.25, 1.0]] },
        { lines: [['Hidden camera available', 337.27, 537.31, 1.0]] },
      ] },
    ],
  },
  // Page 10
  {
    cols: [17.52, 63.72, 145.1, 270.17, 412.01, 537.19, 680.5, 764.76, 830.52],
    rows: [
      { header: true, top: 50.04, bottom: 83.3, cells: [
        { lines: [['Test', 63.74, 27.36, 1.16], ['Cases', 77.9, 23.28, 1.16]] },
        { lines: [['RFP Clause', 70.94, 69.36, 1.16]] },
        { lines: [['Test Description', 70.94, 156.38, 1.1]] },
        { lines: [['Test Parameters', 70.94, 290.81, 1.1]] },
        { lines: [['Test Procedure', 70.94, 427.87, 1.1]] },
        { lines: [['Test Result', 70.94, 573.55, 1.16]] },
        { lines: [['Complianc', 63.74, 689.86, 1.1], ['e (Y/N)', 77.9, 701.62, 1.1]] },
        { lines: [['Remark', 63.74, 773.88, 1.1], ['s', 77.9, 795.0, 1.1]] },
      ] },
      { test: 'T24', top: 83.3, bottom: 238.97, cells: [
        { lines: [['T-24', 164.9, 28.92, 1.04]] },
        { lines: [] },
        { lines: [] },
        { lines: [['Camera will capture a', 94.34, 270.41, 1.15], ['snapshot every time the', 107.18, 270.41, 1.15], ['door is opened and', 120.14, 270.41, 1.15], ['continues to take', 132.98, 270.41, 1.15], ['snapshots at every', 145.94, 270.41, 1.15], ['5minutes for one hour', 158.78, 270.41, 1.15], ['and there after every 15', 171.77, 270.41, 1.15], ['minutes until the door is', 184.61, 270.41, 1.15], ['closed and sends the', 197.57, 270.41, 1.15], ['snapshot to SNOC, where', 210.41, 270.41, 1.15], ['it is stored for at least', 223.25, 270.41, 1.15], ['15days backup.', 236.21, 270.41, 1.15]] },
        { lines: [['Functionality to be', 158.78, 412.25, 1.15], ['checked at SNOC.', 171.77, 412.25, 1.15]] },
        { lines: [['Functionality checked', 158.78, 537.31, 1.15]] },
      ] },
      { test: 'T25', top: 238.97, bottom: 387.07, cells: [
        { lines: [['T-25', 327.19, 28.92, 1.04]] },
        { lines: [['Sec-IV-C,', 314.11, 81.02, 1.15], ['Anx-B', 327.07, 88.58, 1.15], ['(VI.12)', 339.91, 88.7, 1.0]] },
        { lines: [['Access control system', 301.27, 145.34, 1.15], ['rights and protection', 314.11, 145.34, 1.15]] },
        { lines: [['The password for access', 249.65, 270.41, 1.15], ['control system can be', 262.49, 270.41, 1.15], ['remotely reset by a Super', 275.45, 270.41, 1.15], ['User at SNOC. In case of', 288.31, 270.41, 1.15], ['unauthorized access of', 301.27, 270.41, 1.15], ['cabinet or wrong', 314.11, 270.41, 1.15], ['password is entered, a', 327.07, 270.41, 1.15], ['notification will be sent to', 339.91, 270.41, 1.15], ['the SNOC and after three', 352.87, 270.41, 1.15], ['failed attempts, the', 365.71, 270.41, 1.15], ['password will be disabled.', 378.67, 270.41, 1.09]] },
        { lines: [['Functionality to be', 314.11, 412.25, 1.15], ['checked at SNOC.', 327.07, 412.25, 1.15]] },
        { lines: [['Functionality checked', 327.07, 537.31, 1.15]] },
      ] },
      { test: 'T26', top: 387.07, bottom: 441.1, cells: [
        { lines: [['T-26', 423.34, 28.92, 1.04]] },
        { lines: [['Sec-IV-C,', 410.38, 81.02, 1.15], ['Anx-B', 423.34, 88.58, 1.15], ['(VI.13)', 436.18, 88.7, 1.0]] },
        { lines: [['eMS for Rack', 410.62, 145.34, 1.15], ['Operations-', 423.58, 145.34, 1.15]] },
        { lines: [['The status of all the racks', 397.78, 270.41, 1.09], ['and all the alarms shall', 410.62, 270.41, 1.09], ['be available in the SNOC', 423.58, 270.41, 1.09], ['to be supplied.', 436.42, 270.41, 1.15]] },
        { lines: [['Functionality to be', 410.62, 412.25, 1.15], ['checked at SNOC', 423.58, 412.25, 1.15]] },
        { lines: [['Functionality checked', 410.62, 537.31, 1.15]] },
      ] },
    ],
  },
  // Page 11
  {
    cols: [17.52, 63.72, 145.1, 270.17, 412.01, 537.19, 680.5, 764.76, 830.52],
    rows: [
      { header: true, top: 50.04, bottom: 83.3, cells: [
        { lines: [['Test', 63.74, 27.36, 1.16], ['Cases', 77.9, 23.28, 1.16]] },
        { lines: [['RFP Clause', 70.94, 69.36, 1.16]] },
        { lines: [['Test Description', 70.94, 156.38, 1.1]] },
        { lines: [['Test Parameters', 70.94, 290.81, 1.1]] },
        { lines: [['Test Procedure', 70.94, 427.87, 1.1]] },
        { lines: [['Test Result', 70.94, 573.55, 1.16]] },
        { lines: [['Complianc', 63.74, 689.86, 1.1], ['e (Y/N)', 77.9, 701.62, 1.1]] },
        { lines: [['Remark', 63.74, 773.88, 1.1], ['s', 77.9, 795.0, 1.1]] },
      ] },
      { test: 'T27', top: 83.3, bottom: 139.49, cells: [
        { lines: [['T-27', 119.78, 28.32, 1.04]] },
        { lines: [['Sec-IV-C,', 106.94, 81.02, 1.15], ['Anx-B', 119.9, 88.58, 1.15], ['(VI.14)', 132.74, 88.7, 1.0]] },
        { lines: [['Power Supply', 107.18, 145.34, 1.04]] },
        { lines: [['Power supply to the Rack', 94.34, 270.41, 1.09], ['shall be without external', 107.18, 270.41, 1.09], ['ON/OFF switch', 120.14, 306.41, 1.09]] },
        { lines: [['Physically checked to', 94.34, 412.25, 1.15], ['disconnect the', 107.18, 412.25, 1.15], ['external power supply.', 120.14, 412.25, 1.15]] },
        { lines: [['Rack supply automatically', 94.34, 537.31, 1.15], ['shifted to backup supply', 107.18, 537.31, 1.15], ['without any time delay', 120.14, 537.31, 1.15], ['and equipment shutdown', 132.98, 537.31, 1.15]] },
      ] },
    ],
  },
];
