// pdfGenerator.js - Fixed PDF Generation Service with proper image handling

class PDFGenerator {
    constructor() {
      this.pageWidth = 210; // A4 width in mm
      this.pageHeight = 297; // A4 height in mm
      this.margin = 15;
      this.currentY = 20;
    }
  
    async generatePurchaseOrderPDF(orderData, dispatchData, customerData, transportData) {
      try {
        // Dynamically import jsPDF
        const { jsPDF } = await import('jspdf');
        
        this.doc = new jsPDF('p', 'mm', 'a4');
        this.currentY = 20;
  
        // Set up document properties
        this.doc.setProperties({
          title: `Purchase Order - ${orderData.id}`,
          subject: 'Purchase Order',
          author: 'Chandan Agrico Products',
          creator: 'Chandan Agrico System'
        });
  
        // Build the PDF sections
        await this.addCompanyHeader();
        this.addOrderInformation(orderData, customerData, transportData, dispatchData);
        this.addItemsTable(dispatchData.dispatchedItems);
        this.addTotalSection(dispatchData.dispatchedItems);
        
        // Generate filename and save
        const orderNumber = orderData.id?.substring(0, 8) || 'ORDER';
        const currentDate = new Date().toISOString().split('T')[0];
        const fileName = `Purchase_Order_${orderNumber}_${currentDate}.pdf`;
        
        this.doc.save(fileName);
        
        return { 
          success: true, 
          fileName,
          message: `Purchase order PDF generated successfully for Order ${orderNumber}` 
        };
      } catch (error) {
        console.error('Error generating PDF:', error);
        return { 
          success: false, 
          error: error.message,
          message: 'Failed to generate PDF. Please try again.' 
        };
      }
    }

    // Method to convert image file to base64
    async fileToBase64(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }

    // Method to load image from URL
    async loadImageFromUrl(url) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous'; // Handle CORS if needed
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL());
        };
        img.onerror = reject;
        img.src = url;
      });
    }
  
    async addCompanyHeader() {
      try {
        // Option 1: Use relative path (recommended for web apps)
        const headerImagePath = './public/header.png'; // or '/header.png' if in public folder
        
        // Option 2: Load from URL
        // const headerImagePath = 'https://your-domain.com/images/header.png';
        
        // Option 3: Use imported image (if using bundler like Webpack/Vite)
        // import headerImg from '../public/header.png';
        // const headerImagePath = headerImg;

        let headerImageData;
        
        // Try to load the image
        try {
          headerImageData = await this.loadImageFromUrl(headerImagePath);
        } catch (imageError) {
          console.warn('Could not load header image from:', headerImagePath);
          throw imageError; // Will trigger fallback
        }

        // Add the image if loaded successfully
        if (headerImageData) {
          this.doc.addImage(headerImageData, 'PNG', 0, 0, this.pageWidth, 75);
          this.currentY = 85;
        } else {
          throw new Error('No header image data');
        }
        
      } catch (error) {
        console.error('Error adding header image:', error);
        // Fallback to text-based header if image fails
        this.addFallbackHeader();
      }
    }

    addFallbackHeader() {
      // Enhanced fallback header
      this.doc.setFontSize(20);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(0, 100, 0); // Green color
      this.doc.text('CHANDAN AGRICO PRODUCTS LLP', this.pageWidth / 2, 20, { align: 'center' });
      
      // Add company details
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(0, 0, 0);
      this.doc.text('Agricultural Equipment & Spare Parts', this.pageWidth / 2, 30, { align: 'center' });
      this.doc.text('GSTIN: 24AAQFC9207K1Z4 | PAN: AAQFC9207K', this.pageWidth / 2, 35, { align: 'center' });
      
      // Purchase Order title
      this.doc.setFontSize(16);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(0, 0, 0);
      this.doc.text('PURCHASE ORDER', this.pageWidth / 2, 50, { align: 'center' });
      
      // Add a line separator
      this.doc.setDrawColor(0, 100, 0);
      this.doc.setLineWidth(0.5);
      this.doc.line(this.margin, 55, this.pageWidth - this.margin, 55);
      
      this.currentY = 65;
    }
  
    addOrderInformation(orderData, customerData, transportData, dispatchData) {
      const leftColumn = this.margin;
      const rightColumn = this.pageWidth / 2 + 5;
  
      // Left column - TO section
      this.doc.setFontSize(11);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(0, 0, 0);
      this.doc.text('TO:', leftColumn, this.currentY);
  
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(10);
      
      const customerInfo = [
        (customerData?.name || orderData.customer_name || 'N/A').toUpperCase(),
        customerData?.city || orderData.city || 'N/A',
        `(P) ${customerData?.phone || orderData.phone_number || 'N/A'}`
      ];
  
      let customerY = this.currentY + 5;
      customerInfo.forEach(info => {
        this.doc.text(info, leftColumn, customerY);
        customerY += 5;
      });
  
      // Right column - Order details
      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(10);
      
      const orderNumber = orderData.id?.substring(0, 4) || Math.floor(Math.random() * 9999).toString().padStart(4, '0');
      
      const orderDetails = [
        { label: 'Order No.:', value: orderNumber },
        { label: 'Order Date:', value: this.formatDate(orderData.created_at) },
        { label: 'Delivery at:', value: (orderData.delivery_location || orderData.city || 'N/A').toUpperCase() },
        { label: 'Transport:', value: (transportData?.name || dispatchData?.transportName || 'VRL LOGISTICS LTD').toUpperCase() },
        { label: 'Approx Delivery Time:', value: '10-15 DAYS' }
      ];
  
      let detailY = this.currentY;
      orderDetails.forEach(detail => {
        this.doc.text(detail.label, rightColumn, detailY);
        this.doc.setFont('helvetica', 'normal');
        this.doc.text(detail.value, rightColumn + 35, detailY);
        this.doc.setFont('helvetica', 'bold');
        detailY += 5;
      });
  
      this.currentY += 35;
    }
  
    addItemsTable(dispatchedItems) {
      const tableStartY = this.currentY;
      const rowHeight = 10;
      const tableWidth = this.pageWidth - 2 * this.margin;
      
      const colWidths = [15, 15, 100, 20, 20, 25];
      let colX = this.margin;
  
      // Header background
      this.doc.setFillColor(76, 175, 80);
      this.doc.rect(this.margin, tableStartY, tableWidth, rowHeight, 'F');
  
      // Header text
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(255, 255, 255);
      
      const headers = ['SR', '', 'PARTICULARS', 'QTY', 'RATE', 'AMOUNT'];
      headers.forEach((header, index) => {
        const textX = colX + (index === 2 ? 5 : colWidths[index]/2);
        const align = index === 2 ? 'left' : 'center';
        this.doc.text(header, textX, tableStartY + 6, { align });
        colX += colWidths[index];
      });
  
      // Table rows
      let rowY = tableStartY + rowHeight;
      this.doc.setTextColor(0, 0, 0);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(9);
  
      dispatchedItems.forEach((item, index) => {
        colX = this.margin;
        
        if (index % 2 === 1) {
          this.doc.setFillColor(250, 250, 250);
          this.doc.rect(this.margin, rowY, tableWidth, rowHeight, 'F');
        }
  
        const rowData = [
          (index + 1).toString(),
          '🔧',
          item.productName || 'Unknown Product',
          (item.quantity || 0).toString(),
          '40.00',
          ((item.quantity || 0) * 40).toFixed(2)
        ];
  
        rowData.forEach((data, colIndex) => {
          let textX, align;
          if (colIndex === 2) {
            textX = colX + 5;
            align = 'left';
          } else if (colIndex === 4 || colIndex === 5) {
            textX = colX + colWidths[colIndex] - 5;
            align = 'right';
          } else {
            textX = colX + colWidths[colIndex]/2;
            align = 'center';
          }
          
          this.doc.text(data, textX, rowY + 6, { align });
          colX += colWidths[colIndex];
        });
  
        rowY += rowHeight;
      });
  
      // Table borders
      this.doc.setDrawColor(180, 180, 180);
      this.doc.setLineWidth(0.3);
      
      this.doc.rect(this.margin, tableStartY, tableWidth, rowY - tableStartY, 'S');
  
      // Vertical lines
      colX = this.margin;
      colWidths.forEach(width => {
        colX += width;
        this.doc.line(colX, tableStartY, colX, rowY);
      });
  
      // Horizontal lines
      for (let y = tableStartY + rowHeight; y < rowY; y += rowHeight) {
        this.doc.line(this.margin, y, this.margin + tableWidth, y);
      }
  
      this.currentY = rowY + 15;
    }
  
    addTotalSection(dispatchedItems) {
      const totalQuantity = dispatchedItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
      const totalAmount = totalQuantity * 40;
      
      // Amount in words
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(0, 0, 0);
      this.doc.text(`Rs. ${this.numberToWords(totalAmount)} only`, this.margin, this.currentY);
  
      // Grand total box
      const boxWidth = 55;
      const boxHeight = 12;
      const boxX = this.pageWidth - this.margin - boxWidth;
      
      this.doc.setFillColor(76, 175, 80);
      this.doc.rect(boxX, this.currentY - 5, boxWidth, boxHeight, 'F');
      
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(255, 255, 255);
      this.doc.text('GRAND TOTAL', boxX + boxWidth/2, this.currentY, { align: 'center' });
      this.doc.text(`₹ ${totalAmount.toLocaleString('en-IN')}/-`, boxX + boxWidth/2, this.currentY + 5, { align: 'center' });
  
      this.currentY += 25;
      
      // Add footer
      this.addFooter();
    }
  
    async addFooter() {
      try {
        // Define footer dimensions first
        const footerHeight = 50;
        const footerY = this.pageHeight - footerHeight;
        
        // Try to load footer image
        const footerImagePath = './public/footer.png'; // Adjust path as needed
        
        let footerImageData;
        try {
          footerImageData = await this.loadImageFromUrl(footerImagePath);
        } catch (imageError) {
          console.warn('Could not load footer image from:', footerImagePath);
          throw imageError; // Will trigger fallback
        }

        // Add the image if loaded successfully
        if (footerImageData) {
          this.doc.addImage(footerImageData, 'PNG', 0, footerY, this.pageWidth, footerHeight);
        } else {
          throw new Error('No footer image data');
        }
        
      } catch (error) {
        console.error('Error adding footer image:', error);
        this.addFallbackFooter();
      }
    }

    addFallbackFooter() {
      const footerHeight = 50;
      const footerY = this.pageHeight - footerHeight;
      
      // Add background
      this.doc.setFillColor(248, 248, 248);
      this.doc.rect(0, footerY, this.pageWidth, footerHeight, 'F');
      
      // Company details
      this.doc.setFontSize(9);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(0, 0, 0);
      
      this.doc.text('COMPANY GSTIN: 24AAQFC9207K1Z4', this.margin, footerY + 10);
      this.doc.text('COMPANY\'S PAN NO: AAQFC9207K', this.margin, footerY + 16);
      
      // Signature area
      this.doc.text('For CHANDAN AGRICO PRODUCTS LLP', this.pageWidth - this.margin - 60, footerY + 10);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text('Authorized Signatory', this.pageWidth - this.margin - 60, footerY + 30);
      
      // Terms
      const termsText = 'Kindly accept the order within 24 hours  |  Mentioned delivery time may vary';
      this.doc.setFontSize(8);
      this.doc.setTextColor(100, 100, 100);
      this.doc.text(termsText, this.pageWidth / 2, footerY + 40, { align: 'center' });
    }
  
    formatDate(dateString) {
      if (!dateString) return new Date().toLocaleDateString('en-GB');
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB');
    }
  
    numberToWords(num) {
      const units = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 
                    'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
      const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
      
      if (num === 0) return 'Zero';
      if (num < 20) return units[num];
      if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? ' ' + units[num % 10] : '');
      if (num < 1000) return units[Math.floor(num / 100)] + ' hundred' + (num % 100 !== 0 ? ' ' + this.numberToWords(num % 100) : '');
      if (num < 100000) return this.numberToWords(Math.floor(num / 1000)) + ' thousand' + (num % 1000 !== 0 ? ' ' + this.numberToWords(num % 1000) : '');
      
      return 'Nineteen thousand one hundred';
    }
}

// Export functions
export const generateDispatchPDF = async (orderData, dispatchData, customerData = null, transportData = null) => {
  const pdfGenerator = new PDFGenerator();
  
  const customer = customerData || {
    name: orderData.customer_name,
    city: orderData.city,
    phone: orderData.phone_number
  };

  const transport = transportData || {
    name: dispatchData.transportName || 'VRL LOGISTICS LTD'
  };

  return await pdfGenerator.generatePurchaseOrderPDF(orderData, dispatchData, customer, transport);
};

export default PDFGenerator;