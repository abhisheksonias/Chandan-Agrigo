// pdfGenerator.js - Updated PDF Generation Service with database integration

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
      const orderNumber = orderData.id || 'ORDER';
      const currentDate = new Date().toISOString().split('T')[0];
      const fileName = `Purchase_Order_${orderNumber}_${currentDate}.pdf`;

      // --- Mobile-friendly download logic ---
      // Instead of this.doc.save(fileName), use Blob and createObjectURL for better mobile compatibility
      const pdfBlob = this.doc.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      }, 100);
      // --- End mobile-friendly logic ---
 
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
      // Use absolute path for the background image to ensure compatibility on mobile and desktop
      const formatImagePath = '/format.jpg';
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

    // Order details (right side)    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(10);
    
    const orderNumber = orderData.id || Math.floor(Math.random() * 9999).toString().padStart(4, '0');

    // Use transportName from orderData, fallback to transportData?.name, then dispatchData?.transportName, then 'N/A'
    const transportAgency = (orderData.transportName || transportData?.name || dispatchData?.transportName || 'N/A').toUpperCase();

    const orderDetails = [
      orderNumber,
      this.formatDate(orderData.created_at),
      (orderData.delivery_location || orderData.city || 'N/A').toUpperCase(),
      transportAgency,
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
    
    // Parse dispatchedItems if it's a string
    let items = dispatchedItems;
    if (typeof dispatchedItems === 'string') {
      try {
        items = JSON.parse(dispatchedItems);
      } catch (error) {
        console.error('Error parsing dispatched items:', error);
        items = [];
      }
    }

    // Ensure items is an array
    if (!Array.isArray(items)) {
      console.warn('Dispatched items is not an array:', items);
      items = [];
    }
    
    items.forEach((item, index) => {
      // SR
      this.doc.text((index + 1).toString(), colPositions.sr, rowY, { align: 'center' });
      
      // Particulars - Use productName from database
      const productName = item.productName || 'Unknown Product';
      this.doc.text(productName, colPositions.particulars, rowY);
      
      // Quantity - Always use dispatchedQuantity for consistent format
      const quantity = item.dispatchedQuantity || item.quantity || 0;
      this.doc.text(quantity.toString(), colPositions.qty, rowY, { align: 'center' });
      
      // Rate - Use price from database
      const rate = item.price || 0;
      this.doc.text(rate.toFixed(2), colPositions.rate, rowY, { align: 'right' });
      
      // Amount - Calculate from dispatched quantity and price for consistency
      const amount = quantity * rate;
      this.doc.text(amount.toFixed(2), colPositions.amount, rowY, { align: 'right' });
    
      rowY += rowHeight;
    });
  }

  overlayTotalSection(dispatchedItems) {
    // Parse dispatchedItems if it's a string
    let items = dispatchedItems;
    if (typeof dispatchedItems === 'string') {
      try {
        items = JSON.parse(dispatchedItems);
      } catch (error) {
        console.error('Error parsing dispatched items:', error);
        items = [];
      }
    }

    // Ensure items is an array
    if (!Array.isArray(items)) {
      console.warn('Dispatched items is not an array:', items);
      items = [];
    }

    // Calculate grand total from totalPrice of all items
    const grandTotal = items.reduce((sum, item) => {
      const quantity = item.dispatchedQuantity || item.quantity || 0;
      const rate = item.price || 0;
      const itemTotal = quantity * rate;
      return sum + itemTotal;
    }, 0);
    
    // Amount in words position (based on your format)
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(0, 0, 0);
    const amountInWords = `Rs. ${this.numberToWords(grandTotal)} only`;
    this.doc.text(amountInWords, 25, 226); // Adjust Y position
    
    // Grand total amount in numbers (at the same Y coordinate as words)
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(0, 0, 0); // Black text for better visibility
    this.doc.text(`₹ ${grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/-`, 165, 226, { align: 'center' });
    
    // If there's a separate green background section for grand total, add it there too
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(255, 255, 255); // White text for green background
    this.doc.text(`₹ ${grandTotal.toLocaleString('en-IN')}/-`, 165, 245, { align: 'center' }); // Adjust position for green background section
  }

  formatDate(dateString) {
    if (!dateString) return new Date().toLocaleDateString('en-GB');
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB');
  }

  numberToWords(num) {
    if (num === 0) return 'Zero';
    
    const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const thousands = ['', 'Thousand', 'Lakh', 'Crore'];

    function convertHundreds(n) {
      let result = '';
      
      if (n >= 100) {
        result += units[Math.floor(n / 100)] + ' Hundred ';
        n %= 100;
      }
      
      if (n >= 20) {
        result += tens[Math.floor(n / 10)] + ' ';
        n %= 10;
      } else if (n >= 10) {
        result += teens[n - 10] + ' ';
        return result.trim();
      }
      
      if (n > 0) {
        result += units[n] + ' ';
      }
      
      return result.trim();
    }

    function convertToWords(num) {
      if (num === 0) return '';
      
      let result = '';
      let placeValue = 0;
      
      // Handle crores
      if (num >= 10000000) {
        const crores = Math.floor(num / 10000000);
        result += convertHundreds(crores) + ' Crore ';
        num %= 10000000;
      }
      
      // Handle lakhs
      if (num >= 100000) {
        const lakhs = Math.floor(num / 100000);
        result += convertHundreds(lakhs) + ' Lakh ';
        num %= 100000;
      }
      
      // Handle thousands
      if (num >= 1000) {
        const thousands = Math.floor(num / 1000);
        result += convertHundreds(thousands) + ' Thousand ';
        num %= 1000;
      }
      
      // Handle hundreds, tens, and units
      if (num > 0) {
        result += convertHundreds(num);
      }
      
      return result.trim();
    }

    // Handle decimal part
    const integerPart = Math.floor(num);
    const decimalPart = Math.round((num - integerPart) * 100);
    
    let result = convertToWords(integerPart);
    
    if (decimalPart > 0) {
      result += ' and ' + convertToWords(decimalPart) + ' Paise';
    }
    
    return result || 'Zero';
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

  // Use transportName from orderData if available
  const transport = transportData || {
    name: orderData.transportName || dispatchData.transportName || ''
  };

  return await pdfGenerator.generatePurchaseOrderPDF(orderData, dispatchData, customer, transport);
};

export default PDFGenerator;