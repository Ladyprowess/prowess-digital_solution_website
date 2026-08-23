import { PDFDocument, StandardFonts, rgb, degrees } from "pdf-lib";

// Stamps every page of a PDF with a faint, diagonal label identifying who's
// reading it - not meant to stop a screenshot (nothing can), but if a
// watermarked page leaks, it's traceable back to the buyer instead of
// anonymous. Applied on every request rather than cached, since it's cheap
// (a handful of drawText calls) next to the network round trip already
// happening to fetch the file from Storage.
export async function watermarkPdf(bytes: Uint8Array, label: string): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(bytes);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pages = pdfDoc.getPages();

  for (const page of pages) {
    const { width, height } = page.getSize();
    const fontSize = 12;
    const textWidth = font.widthOfTextAtSize(label, fontSize);

    // Repeated diagonally across the page rather than once in a corner -
    // a single stamp is trivial to crop out of a screenshot, a tiled one
    // survives cropping to any reasonably-sized excerpt.
    const stepX = textWidth + 80;
    const stepY = 90;
    for (let y = -height; y < height * 2; y += stepY) {
      for (let x = -width; x < width * 2; x += stepX) {
        page.drawText(label, {
          x,
          y,
          size: fontSize,
          font,
          color: rgb(0.5, 0.5, 0.5),
          opacity: 0.15,
          rotate: degrees(35),
        });
      }
    }
  }

  return pdfDoc.save();
}
