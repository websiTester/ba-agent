export async function downloadDocument(chunks: {header: string, content: string}[], phaseName: string) {
    const { Document, Packer, Paragraph } = await import('docx');
      
    for (const item of chunks) {

      const paragraphs = item.content.split('\n').map(line => new Paragraph({ text: line }));
      
      const doc = new Document({
        sections: [{ children: paragraphs }],
      });
      
      const blob = await Packer.toBlob(doc);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const fileName = `BA-Agent-${phaseName}-${item.header}-${timestamp}.docx`;
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);
    }
      
}