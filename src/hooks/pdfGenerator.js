// pdfGenerator.js - Enhanced PDF Generation Service
// This uses jsPDF which should be installed: npm install jspdf jspdf-autotable

class PDFGenerator {
    constructor() {
      this.pageWidth = 210; // A4 width in mm
      this.pageHeight = 297; // A4 height in mm
      this.margin = 15;
      this.currentY = 20;
    }
  
    async generatePurchaseOrderPDF(orderData, dispatchData, customerData, transportData) {
      try {
        // Dynamically import jsPDF to avoid build issues
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
        this.addCompanyHeader();
        this.addPurchaseOrderTitle();
        this.addOrderInformation(orderData, customerData, transportData);
        this.addItemsTable(dispatchData.dispatchedItems);
        this.addTotalSection(dispatchData.dispatchedItems);
        this.addFooter();
        
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
  
    addCompanyHeader() {
      // Company logo circle (green)
      this.doc.setFillColor(76, 175, 80);
      this.doc.circle(25, 25, 6, 'F');
      
      // Add "C" in the circle
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(255, 255, 255);
      this.doc.text('C', 25, 27, { align: 'center' });
      
      // Company name
      this.doc.setFontSize(20);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(76, 175, 80);
      this.doc.text('CHANDAN', 35, 23);
      
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(100, 100, 100);
      this.doc.text('AGRICO PRODUCTS LLP', 35, 28);
  
      // TRISHUL branding (top right)
      this.doc.setFontSize(14);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(255, 0, 0);
      this.doc.text('TRISHUL', this.pageWidth - 30, 20);
  
      // Company details (right side)
      this.doc.setFontSize(8);
      this.doc.setTextColor(76, 175, 80);
      
      const companyInfo = [
        "India's Largest Manufacturer of Agricultural Equipment",
        "Shiv Industrial Park, Survey No.212 P1,P2 & P3,",
        "Tal Kle: 34,9, Gandhidham-360 311, Kutch, Gujarat, India",
        "Phone: +91 98980 90398 | +91 98564 91300",
        "Email: chandanagricoproducts@gmail.com"
      ];
  
      let infoY = 25;
      companyInfo.forEach(info => {
        this.doc.text(info, this.pageWidth - 5, infoY, { align: 'right' });
        infoY += 3.5;
      });
  
      this.currentY = 50;
    }
  
    addPurchaseOrderTitle() {
      // Background rectangle for title
      this.doc.setFillColor(76, 175, 80);
      this.doc.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 10, 'F');
      
      // Title text
      this.doc.setFontSize(16);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(255, 255, 255);
      this.doc.text('PURCHASE ORDER', this.pageWidth / 2, this.currentY + 6.5, { align: 'center' });
      
      this.currentY += 20;
    }
  
    addOrderInformation(orderData, customerData, transportData) {
      const leftColumn = this.margin;
      const rightColumn = this.pageWidth / 2 + 10;
  
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
        this.doc.text(detail.value, rightColumn + 40, detailY);
        this.doc.setFont('helvetica', 'bold');
        detailY += 5;
      });
  
      this.currentY += 40;
    }
  
    addItemsTable(dispatchedItems) {
      // Table header
      const tableStartY = this.currentY;
      const rowHeight = 8;
      const tableWidth = this.pageWidth - 2 * this.margin;
      
      // Column widths
      const colWidths = [15, 20, 80, 20, 25, 25]; // SR, ICON, PARTICULARS, QTY, RATE, AMOUNT
      let colX = this.margin;
  
      // Header background
      this.doc.setFillColor(76, 175, 80);
      this.doc.rect(this.margin, tableStartY, tableWidth, rowHeight, 'F');
  
      // Header text
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(255, 255, 255);
      
      const headers = ['SR.', '', 'PARTICULARS', 'QTY', 'RATE', 'AMOUNT'];
      headers.forEach((header, index) => {
        this.doc.text(header, colX + colWidths[index]/2, tableStartY + 5.5, { align: 'center' });
        colX += colWidths[index];
      });
  
      // Table rows
      let rowY = tableStartY + rowHeight;
      this.doc.setTextColor(0, 0, 0);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(9);
  
      dispatchedItems.forEach((item, index) => {
        colX = this.margin;
        
        // Alternate row colors
        if (index % 2 === 1) {
          this.doc.setFillColor(249, 249, 249);
          this.doc.rect(this.margin, rowY, tableWidth, rowHeight, 'F');
        }
  
        // Row data
        const rowData = [
          (index + 1).toString(),
          '🔧',
          item.productName || 'Unknown Product',
          (item.quantity || 0).toString(),
          '40.00',
          ((item.quantity || 0) * 40).toFixed(2)
        ];
  
        rowData.forEach((data, colIndex) => {
          const align = colIndex === 0 || colIndex === 1 || colIndex === 3 ? 'center' : 
                       colIndex === 4 || colIndex === 5 ? 'right' : 'left';
          const textX = align === 'center' ? colX + colWidths[colIndex]/2 : 
                       align === 'right' ? colX + colWidths[colIndex] - 2 : colX + 2;
          
          this.doc.text(data, textX, rowY + 5.5, { align });
          colX += colWidths[colIndex];
        });
  
        rowY += rowHeight;
      });
  
      // Table border
      this.doc.setDrawColor(200, 200, 200);
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
  
      this.currentY = rowY + 10;
    }
  
    addTotalSection(dispatchedItems) {
      const totalQuantity = dispatchedItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
      const totalAmount = totalQuantity * 40; // Placeholder calculation
      
      // Amount in words
      this.doc.setFontSize(9);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(0, 0, 0);
      this.doc.text(`Rs. ${this.numberToWords(totalAmount)} only`, this.margin + 5, this.currentY + 5);
  
      // Grand total box
      const boxWidth = 50;
      const boxHeight = 15;
      const boxX = this.pageWidth - this.margin - boxWidth;
      
      this.doc.setFillColor(76, 175, 80);
      this.doc.rect(boxX, this.currentY, boxWidth, boxHeight, 'F');
      
      this.doc.setFontSize(11);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(255, 255, 255);
      this.doc.text('GRAND TOTAL', boxX + boxWidth/2, this.currentY + 6, { align: 'center' });
      this.doc.text(`₹ ${totalAmount.toLocaleString('en-IN')}/-`, boxX + boxWidth/2, this.currentY + 11, { align: 'center' });
  
      this.currentY += 25;
  
      // Company seal area
      this.doc.setDrawColor(100, 100, 100);
      this.doc.circle(this.pageWidth - 35, this.currentY + 15, 12, 'S');
      this.doc.setFontSize(8);
      this.doc.setTextColor(100, 100, 100);
      this.doc.text('COMPANY', this.pageWidth - 41, this.currentY + 12, { align: 'center' });
      this.doc.text('SEAL', this.pageWidth - 41, this.currentY + 16, { align: 'center' });
      this.doc.text('& SIGNATURE', this.pageWidth - 41, this.currentY + 20, { align: 'center' });
    }
  
    addFooter() {
      const footerY = this.pageHeight - 25;
      
      // Company details
      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(100, 100, 100);
      
      this.doc.text('COMPANY GSTIN : 24AAGFC9247K1Z4', this.margin, footerY);
      this.doc.text('COMPANY\'S PAN NO : AAGFC9247K', this.margin, footerY + 4);
  
      // Terms and conditions
      const termsText = 'Kindly accept the order within 24 hours | Mentioned delivery time may vary';
      this.doc.text(termsText, this.pageWidth / 2, footerY + 10, { align: 'center' });
    }
  
    formatDate(dateString) {
      if (!dateString) return new Date().toLocaleDateString('en-GB');
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB');
    }
  
    numberToWords(num) {
      // Simplified version - you can enhance this
      if (num < 1000) return `${num}`;
      if (num < 100000) return `${(num/1000).toFixed(1)} thousand`;
      if (num < 10000000) return `${(num/100000).toFixed(1)} lakh`;
      return `${(num/10000000).toFixed(1)} crore`;
    }
  }
  
  // Main export function
  export const generateDispatchPDF = async (orderData, dispatchData, customerData = null, transportData = null) => {
    const pdfGenerator = new PDFGenerator();
    
    // Extract customer data from order if not provided
    const customer = customerData || {
      name: orderData.customer_name,
      city: orderData.city,
      phone: orderData.phone_number
    };
  
    // Extract transport data
    const transport = transportData || {
      name: dispatchData.transportName || 'VRL LOGISTICS LTD'
    };
  
    return await pdfGenerator.generatePurchaseOrderPDF(orderData, dispatchData, customer, transport);
  };
  
  // Alternative export for direct class usage
  export default PDFGenerator;