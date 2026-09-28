// Word download for the AT Block Router checklist: the original template
// ("Final AT template for Block router.docx") filled with the entered values, so the
// document has exactly the template's formatting. Values and attachments are placed as
// in the print (atBlockRouterPrint.ts).

import JSZip from 'jszip';
import RouterTemplate from './assets/at-block-router-template.docx?url';
import type { ATBlockRouterPrintData } from './atBlockRouterPrint';
import { W_NS, attachmentsXml, createMedia, insertAfter, runXml, saveDocx, xmlNodes } from './docxUtils';

const els = (root: Document | Element, name: string) => Array.from(root.getElementsByTagNameNS(W_NS, name));

/** Text of a paragraph or cell, with tabs as "\t". */
const textOf = (el: Element) =>
  Array.from(el.getElementsByTagNameNS(W_NS, '*'))
    .map((node) => (node.localName === 't' ? node.textContent ?? '' : node.localName === 'tab' && node.parentNode?.nodeName === 'w:r' ? '\t' : ''))
    .join('');

const directChildren = (el: Element, name: string) =>
  Array.from(el.childNodes).filter((node): node is Element => node.nodeType === 1 && (node as Element).localName === name);

const BODY_TEXT = '<w:sz w:val="22"/>';
const CELL_TEXT = '<w:sz w:val="20"/>';

export const downloadATBlockRouterDocx = async (data: ATBlockRouterPrintData) => {
  const zip = await JSZip.loadAsync(await (await fetch(RouterTemplate)).arrayBuffer());
  const media = await createMedia(zip);
  const doc = new DOMParser().parseFromString(await zip.file('word/document.xml')!.async('string'), 'application/xml');
  const body = els(doc, 'body')[0];
  const paragraphs = () => directChildren(body, 'p');
  const find = (test: (text: string) => boolean) => paragraphs().find((p) => test(textOf(p)));
  const append = (p: Element, xml: string) => xmlNodes(doc, xml).forEach((node) => p.appendChild(node));
  const after = (p: Element | undefined, xml: string) => {
    if (p && xml) insertAfter(p, xmlNodes(doc, xml));
  };

  // ── Acceptance memorandum ─────────────────────────────────────────────────
  const memo = data.memorandum;
  const memoValues: [RegExp, string][] = [
    [/^Equipment description\t:$/, memo.equipmentDescription],
    [/^Site Name with LGD code\t:$/, memo.siteNameLGD],
    [/^Site Address\t:$/, memo.siteAddress],
    [/^Router hostname\t:$/, memo.routerHostname],
    [/^Router WAN interface.*IPaddress:$/, memo.wanInterfaceIp],
    [/^Date & Time\t:$/, memo.dateTime],
  ];
  memoValues.forEach(([pattern, value]) => {
    const p = find((text) => pattern.test(text.trim()));
    if (p && value) append(p, runXml(` ${value}`, BODY_TEXT));
  });
  after(
    find((text) => text.trim() === 'QR code'),
    await attachmentsXml(media, [data.networkDiagram, data.qrCode], { maxWidth: 450, maxHeight: 180, pPr: '<w:ind w:left="165"/>' }),
  );

  // ── Certification verification: files in the right-hand cells ────────────
  const cells = els(doc, 'tc');
  const cellWith = (text: string) => cells.find((tc) => textOf(tc).trim() === text);
  const nextCell = (tc: Element | undefined) => {
    let node = tc?.nextSibling;
    while (node && (node as Element).localName !== 'tc') node = node.nextSibling;
    return node as Element | undefined;
  };
  const certFiles: [Element | undefined, (keyof typeof data.certifications)[]][] = [
    [cellWith('Date of TSEC'), ['tsecCertificate']],
    [cellWith('Date of QA'), ['qaCertificate']],
    [cellWith('Photo evidence'), ['qrCodeLogo', 'photoEvidence']],
    [nextCell(cellWith('OEM approval of BSNL')), ['oemApproval']],
  ];
  for (const [tc, keys] of certFiles) {
    if (!tc) continue;
    const xml = await attachmentsXml(media, keys.map((key) => data.certifications[key]), {
      maxWidth: 280,
      maxHeight: 200,
      pPr: '<w:pStyle w:val="TableParagraph"/><w:ind w:left="110"/>',
    });
    append(tc, xml);
  }

  // ── Pre-AT checks 4(a)-4(h): "Result ____Pass____" ───────────────────────
  const basic = (id: string) => data.basic[id] ?? { compliance: '', remarks: '', files: [] };
  const remarksXml = (remarks: string) =>
    remarks ? `<w:p><w:pPr><w:pStyle w:val="BodyText"/><w:ind w:left="165"/></w:pPr>${runXml(remarks, BODY_TEXT)}</w:p>` : '';
  const resultParagraphs = paragraphs().filter((p) => textOf(p) === 'Result\t');
  resultParagraphs.forEach((p, index) => {
    const id = `T${index + 1}`;
    const { compliance, remarks } = basic(id);
    const result = compliance === 'Yes' ? 'Pass' : compliance === 'No' ? 'Fail' : compliance;
    if (result) {
      // Centre the result on the underline: centre tab between "Result" and the end of the line.
      const tabs = els(p, 'tabs')[0];
      if (tabs) tabs.insertBefore(xmlNodes(doc, '<w:tab w:val="center" w:pos="2800"/>')[0], tabs.firstChild);
      const underlined = directChildren(p, 'r').find((r) => els(r, 'tab').length > 0);
      if (underlined) {
        const valueRun = xmlNodes(doc, runXml(result, '<w:u w:val="single"/><w:w w:val="115"/>'))[0];
        p.insertBefore(underlined.cloneNode(true), underlined);
        p.insertBefore(valueRun, underlined);
      }
    }
    after(p, remarksXml(remarks));
  });
  after(find((text) => text.startsWith('4 (i):')), remarksXml(basic('T9').remarks));
  after(find((text) => text.startsWith('(j): Activation')), remarksXml(basic('T10').remarks));

  // Attachments of all pre-AT checks, at the bottom of the section.
  let checksXml = '';
  for (let i = 1; i <= 10; i++) {
    checksXml += await attachmentsXml(media, basic(`T${i}`).files, {
      maxWidth: 450,
      maxHeight: 300,
      pPr: '<w:ind w:left="165"/>',
    });
  }
  after(find((text) => text.startsWith('*The above checks/tests')), checksXml);

  // ── Test tables: configuration, results (+ evidence), status ────────────
  let testId = '';
  for (const tbl of directChildren(body, 'tbl')) {
    for (const tr of directChildren(tbl, 'tr')) {
      const [labelCell, valueCell] = directChildren(tr, 'tc');
      if (!labelCell || !valueCell) continue;
      const label = textOf(labelCell).trim();
      if (label === 'Test No') testId = `N${textOf(valueCell).trim()}`;
      const t = data.network[testId];
      if (!t) continue;
      if (label === 'Test Configuration' && t.testConfiguration) {
        setCell(valueCell, t.testConfiguration, '');
      } else if (label === 'Test Results') {
        const text = [t.testResults, t.remarks].filter(Boolean).join('\n');
        const files = await attachmentsXml(media, t.files, {
          maxWidth: 360,
          maxHeight: 330,
          pPr: '<w:pStyle w:val="TableParagraph"/><w:ind w:left="57"/>',
        });
        if (text || files) setCell(valueCell, text, files);
      } else if (label === 'Status' && t.status) {
        const p = els(valueCell, 'p').find((para) => textOf(para).includes('Pass / Fail'));
        if (p) {
          const rPr = els(p, 'rPr').find((el) => el.parentNode?.nodeName === 'w:r');
          directChildren(p, 'r').forEach((r) => p.removeChild(r));
          append(p, `<w:r>${rPr ? new XMLSerializer().serializeToString(rPr) : ''}<w:t>${t.status}</w:t></w:r>`);
        }
      }
    }
  }

  // Replaces the text of a cell's first paragraph and appends `extraXml` paragraphs.
  function setCell(tc: Element, text: string, extraXml: string) {
    const p = els(tc, 'p')[0];
    directChildren(p, 'r').forEach((r) => p.removeChild(r));
    if (text) append(p, runXml(text, CELL_TEXT));
    if (extraXml) xmlNodes(doc, extraXml).forEach((node) => tc.appendChild(node));
  }

  zip.file('word/document.xml', new XMLSerializer().serializeToString(doc));
  await media.finalize();
  await saveDocx(zip, `AT Block Router - ${data.blockName || 'Checklist'}.docx`);
};
