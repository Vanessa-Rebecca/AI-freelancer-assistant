import { Button } from '../ui/Button.tsx';

/**
 * Opens the browser's print dialog, where "Save as PDF" is built in.
 * The page title becomes the suggested file name while the dialog is open.
 */
export function ExportPdfButton({ fileName }: { fileName: string }) {
  const exportPdf = () => {
    const previous = document.title;
    document.title = fileName.replace(/[\\/:*?"<>|]+/g, '-');
    window.addEventListener('afterprint', () => (document.title = previous), { once: true });
    window.print();
  };

  return (
    <Button variant="secondary" onClick={exportPdf}>
      Export PDF
    </Button>
  );
}
