const { chromium } = require('playwright');
(async () => {
  const [src, out] = process.argv.slice(2);
  const b = await chromium.launch(); const p = await b.newPage();
  await p.goto('file://' + src, { waitUntil: 'load', timeout: 0 });
  await p.pdf({ path: out, format: 'Letter', printBackground: true,
    margin: { top: '0.7in', bottom: '0.8in', left: '0.6in', right: '0.6in' },
    displayHeaderFooter: true, headerTemplate: '<span></span>',
    footerTemplate: '<div style="font-size:7.5px;width:100%;padding:0 0.6in;display:flex;justify-content:space-between;color:#555;font-family:Arial,sans-serif"><span>Tradução não oficial, sujeita a erros. Em caso de dúvida, consulte o manual oficial da FIRST em inglês.</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>' });
  await b.close();
})();
