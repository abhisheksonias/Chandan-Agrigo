// pdfGenerator.js - Updated PDF Generation Service with background format image

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

      // Add the background format first
      await this.addBackgroundFormat();
      
      // Then overlay the text content
      this.overlayOrderInformation(orderData, customerData, transportData, dispatchData);
      this.overlayItemsTable(dispatchData.dispatchedItems);
      this.overlayTotalSection(dispatchData.dispatchedItems);
      
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
      img.crossOrigin = 'anonymous';
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

  async addBackgroundFormat() {
    try {
      // Path to your purchase order format image
      const formatImagePath = './public/format.jpg'; // Update this path
      // Alternative paths you might use:
      // const formatImagePath = '/images/purchase-order-format.png';
      // const formatImagePath = 'https://your-domain.com/purchase-order-format.png';
      
      let formatImageData;
      
      try {
        formatImageData = await this.loadImageFromUrl(formatImagePath);
      } catch (imageError) {
        console.warn('Could not load format image from:', formatImagePath);
        throw imageError;
      }

      // Add the format image as full-page background
      if (formatImageData) {
        this.doc.addImage(formatImageData, 'PNG', 0, 0, this.pageWidth, this.pageHeight);
      } else {
        throw new Error('No format image data');
      }
      
    } catch (error) {
      console.error('Error adding background format:', error);
      // Fallback to original design if format image fails
      this.addFallbackDesign();
    }
  }

  addFallbackDesign() {
    // Fallback design that mimics your format
    // Header section with company info
    this.doc.setFillColor(76, 175, 80);
    this.doc.rect(0, 0, this.pageWidth, 80, 'F');
    
    // Company name
    this.doc.setFontSize(20);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(255, 255, 255);
    this.doc.text('CHANDAN AGRICO PRODUCTS LLP', this.pageWidth / 2, 25, { align: 'center' });
    
    // Subtitle
    this.doc.setFontSize(12);
    this.doc.text("India's Largest Manufacturer of Agricultural Equipment", this.pageWidth / 2, 35, { align: 'center' });
    
    // Contact details
    this.doc.setFontSize(10);
    this.doc.text('📍 Shiv Industrial Park, Survey No. 212 P1-P2 & 213,', 15, 50);
    this.doc.text('Plot No. 12 & 13, Gundasara- 360 311,', 20, 55);
    this.doc.text('Tal. Gondal. Dist. Rajkot, Gujarat, INDIA', 20, 60);
    this.doc.text('📧 chandanagricoproductsllp@gmail.com', 15, 65);
    
    this.doc.text('📞 +91 95860 90390', this.pageWidth - 60, 50);
    this.doc.text('📞 +91 98243 90390', this.pageWidth - 60, 55);
    this.doc.text('📘 chandanagricoproductsllp', this.pageWidth - 60, 60);
    
    // Purchase Order title
    this.doc.setFillColor(255, 255, 255);
    this.doc.rect(0, 80, this.pageWidth, 25, 'F');
    this.doc.setFontSize(18);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(0, 0, 0);
    this.doc.text('PURCHASE ORDER', this.pageWidth / 2, 95, { align: 'center' });
    
    // Footer area
    this.doc.setFillColor(240, 240, 240);
    this.doc.rect(0, this.pageHeight - 50, this.pageWidth, 50, 'F');
  }

  overlayOrderInformation(orderData, customerData, transportData, dispatchData) {
    // Position coordinates based on your format image
    const leftColumnX = 30;  // TO: section X position
    const rightColumnX = 150; // Order details X position
    const startY = 95;       // Starting Y position after header

    // TO: section (left side)
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(0, 0, 0);
    
    // Customer information
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(10);
    
    const customerInfo = [
      (customerData?.name || orderData.customer_name || 'N/A').toUpperCase(),
      customerData?.city || orderData.city || 'N/A',
      `(P) ${customerData?.phone || orderData.phone_number || 'N/A'}`
    ];

    let customerY = startY;
    customerInfo.forEach(info => {
      this.doc.text(info, leftColumnX, customerY);
      customerY += 6;
    });

    // Order details (right side)
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(10);
    
    const orderNumber = orderData.id?.substring(0, 8) || Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    
    const orderDetails = [
      orderNumber,
      this.formatDate(orderData.created_at),
      (orderData.delivery_location || orderData.city || 'N/A').toUpperCase(),
      (transportData?.name || dispatchData?.transportName || 'VRL LOGISTICS LTD').toUpperCase(),
      '10-15 DAYS'
    ];

    let detailY = startY;
    orderDetails.forEach(detail => {
      this.doc.text(detail, rightColumnX, detailY);
      detailY += 6;
    });
  }

  overlayItemsTable(dispatchedItems) {
    // Table content positioning based on your format
    const tableStartY = 140; // Adjust based on your format
    const rowHeight = 8;
    
    // Column positions matching your format
    const colPositions = {
      sr: 25,        // SR column
      particulars: 70, // PARTICULARS column  
      qty: 120,      // QTY column
      rate: 152,     // RATE column
      amount: 182   // AMOUNT column
    };

    // Table content
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(0, 0, 0);

    let rowY = tableStartY;
    
    dispatchedItems.forEach((item, index) => {
      // SR
      this.doc.text((index + 1).toString(), colPositions.sr, rowY, { align: 'center' });
      
      // Particulars
      this.doc.text(item.productName || 'Unknown Product', colPositions.particulars, rowY);
      
      // Quantity
      this.doc.text((item.quantity || 0).toString(), colPositions.qty, rowY, { align: 'center' });
      
      // Rate
      this.doc.text('40.00', colPositions.rate, rowY, { align: 'right' });
      
      // Amount
      this.doc.text(((item.quantity || 0) * 40).toFixed(2), colPositions.amount, rowY, { align: 'right' });

      rowY += rowHeight;
    });
  }

  overlayTotalSection(dispatchedItems) {
    const totalQuantity = dispatchedItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const totalAmount = totalQuantity * 40;
    
    // Amount in words position (based on your format)
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(0, 0, 0);
    this.doc.text(`Rs. ${this.numberToWords(totalAmount)} only`, 25, 226); // Adjust Y position
    
    // Grand total amount (position based on your format)
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(255, 255, 255); // White text for green background
    this.doc.text(`₹ ${totalAmount.toLocaleString('en-IN')}/-`, 165, 245, { align: 'center' }); // Adjust position
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