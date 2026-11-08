const { chromium } = require('playwright');
(async () => {
  const [src, out, header] = process.argv.slice(2);
  const b = await chromium.launch(); const p = await b.newPage();
  await p.goto('file://' + src, { waitUntil: 'load' });
  await p.pdf({ path: out, format: 'Letter', printBackground: true,
    margin: { top: '0.75in', bottom: '0.75in', left: '0.6in', right: '0.6in' },
    displayHeaderFooter: !!header, headerTemplate: header || '<span></span>',
    footerTemplate: '<div style="font-size:7px;width:100%;text-align:center;color:#666"><span class="pageNumber"></span> / <span class="totalPages"></span></div>' });
  await b.close();
})();
