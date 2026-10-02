import puppeteer from 'puppeteer-core';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generatePdf() {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const htmlPath = path.resolve(__dirname, '..', 'USER_MANUAL_BA.html');
  const pdfPath = path.resolve(__dirname, '..', 'USER_MANUAL_BA.pdf');

  console.log('Khởi chạy Edge headless tại:', edgePath);
  console.log('Đang đọc file HTML:', htmlPath);

  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });

  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '15mm',
      bottom: '15mm',
      left: '12mm',
      right: '12mm'
    }
  });

  await browser.close();
  console.log('✅ Xuất PDF thành công tại:', pdfPath);
}

generatePdf().catch(err => {
  console.error('Lỗi khi xuất PDF:', err);
  process.exit(1);
});
