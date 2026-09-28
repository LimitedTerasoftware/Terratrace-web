// Template text of the Block Rack AT pages 1-4 (ABP/AT/BLRK/002 Ver1.0), with the line
// breaks of the reference document. Shared by the print (atBlockRackPrint.ts) and the
// Word download (atBlockRackDocx.ts); the section 3.1 table text is in atBlockRackTable.ts.

import { RACK_TABLE_PAGES, RackCell } from './atBlockRackTable';

export const COVER_TITLE = [
  'Acceptance Testing Test Cases document for Block Rack as per BSNL',
  'Bharatnet Tender No. MM/BNO&M/BN-III/T-791/2024 issued on 15.02.2024',
];

export const INTRO_1 = [
  'This document outlines the Acceptance Testing (A/T) procedures for Smart Rack at',
  'Block, in accordance with the requirements of BSNL BharatNet Tender No.',
  'MM/BNO&M/BN-III/T-791/2024 dated 15.02.2024.',
];

export const INTRO_2 = [
  'It covers the applicable test cases in line with industry best practices, relevant',
  'specifications and standards, and includes the acceptance testing template for quality',
  'assurance in accordance with the requirements specified in the RFP.',
];

export const DECLARATION = [
  'We hereby declare that all tests in this form were successfully completed. Note (if',
  'any):',
];

export const SIGN_OFF = ['PIA Representative’s Sign off', 'IE Representative’s Sign off', 'BSNL Representative’s Sign off*'];
export const SIGN_OFF_LINES = ['Representative Name:', 'Designation:', 'Date:'];

export const NOTE_1 = [
  'For first time AT of Block Router, GP Router, Block Rack, GP Rack, Route and',
  'Ring, one BSNL person may be kept mandatorily and his/her signatures are',
  'required on the AT document.',
];

export const NOTE_2 = [
  'For subsequent ATs, BSNL may assign person on need basis or as requested by',
  'any PIA. Decision regarding the same shall be taken by BharatNet State Head on',
  'case-to-case basis.',
];

export const CERT_STANDARDS = [
  'Rack: DIN41491, DIN41494, and',
  'IEC297.',
  'All products/OEM: ISO 9001,',
  '14001, ISO 45001 and IS13252:',
  'PART1 (2010) & IEC 60950-1.',
  'Protection category: IP55:',
  'IS/IEC60529:2001. Certificate',
  'from NABL accredited lab shall be',
  'attached',
];

/** Documentation requirements cell: paragraphs as [first baseline, lines, horizontal scale]. */
export const DOC_REQUIREMENTS: [number, string[], number][] = [
  [374.33, ['Test 1: The contractor shall provide following', 'documents:'], 1.1],
  [400.01, ['a. System description documents'], 1.15],
  [412.97, ['b. Installation, Operation and Maintenance', 'documents'], 1.15],
  [451.75, ['Test 2: All technical documents shall be in English', 'language both in CD- ROM and in hard copy.'], 1.15],
  [489.43, ['To be provided by PIA along with first BLOCK AT', 'offered for the package'], 1.1],
];

/**
 * Template text of every test (columns 0-5, T1..T27 in order). In the reference table
 * some tests share merged RFP Clause / Test Description cells and some continue on the
 * next page; here each test gets its own copy of that text.
 */
export const rackTestColumns = () => {
  const testText = new Map<string, RackCell[][]>();
  // Last text seen per column: a merged cell continued from the previous page is empty.
  const lastText: RackCell[][] = [[], [], [], [], [], []];
  let current = '';
  RACK_TABLE_PAGES.forEach((page) => {
    const covering: (RackCell | undefined)[] = [];
    page.rows.forEach((row) => {
      if (row.header) return;
      if (row.test) current = row.test;
      if (!current) return;
      const columns = testText.get(current) ?? [[], [], [], [], [], []];
      row.cells.forEach((cell, c) => {
        if (cell?.rowspan) covering[c] = cell;
        else if (cell) covering[c] = undefined;
        const source = cell ?? covering[c];
        if (source?.lines.length && !columns[c].includes(source)) columns[c].push(source);
      });
      testText.set(current, columns);
    });
  });
  testText.forEach((columns) =>
    columns.forEach((cells, c) => {
      if (cells.length) lastText[c] = cells;
      else columns[c] = lastText[c];
    }),
  );
  return testText;
};
