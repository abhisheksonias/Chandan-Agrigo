// pdfGenerator.js - PDF Generation Service with selective compression

class PDFGenerator {
  constructor() {
    this.pageWidth = 210; // A4 width in mm
    this.pageHeight = 297; // A4 height in mm
    this.margin = 15;
    this.currentY = 20;
    
    // Compression settings for product images only
    this.maxProductImageWidth = 300; // Maximum width for product images
    this.maxProductImageHeight = 300; // Maximum height for product images
    this.productImageQuality = 0.6; // JPEG quality for product images (0.1 to 1.0)
  }

  async generatePurchaseOrderPDF(orderData, dispatchData, customerData, transportData, products = []) {
    try {
      // Dynamically import jsPDF
      const { jsPDF } = await import('jspdf');
      
      // Use compression options for PDF structure only
      this.doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
        compress: true, // Enable PDF compression
        precision: 2 // Reduce coordinate precision
      });
      
      this.currentY = 20;

      // Set up document properties
      this.doc.setProperties({
        title: `Purchase Order - ${orderData.id}`,
        subject: 'Purchase Order',
        author: 'Chandan Agrico Products',
        creator: 'Chandan Agrico System'
      });

      // Add the background format first (NO compression for format image)
      await this.addBackgroundFormat();
      
      // Then overlay the text content
      this.overlayOrderInformation(orderData, customerData, transportData, dispatchData);
      await this.overlayItemsTable(dispatchData.dispatchedItems, products);
      this.overlayTotalSection(dispatchData.dispatchedItems);
        
      // Generate filename and save
      const orderNumber = orderData.id || 'ORDER';
      const currentDate = new Date().toISOString().split('T')[0];
      const fileName = `Purchase_Order_${orderNumber}_${currentDate}.pdf`;

      // --- Mobile-friendly download logic ---
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
        message: `Purchase order PDF generated successfully for Order ${orderNumber}`,
        fileSize: Math.round(pdfBlob.size / 1024) + ' KB' // Show file size
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

  // Product image compression method (kept for small product icons in table)
  async compressProductImage(imageData, maxWidth = this.maxProductImageWidth, maxHeight = this.maxProductImageHeight, quality = this.productImageQuality) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Calculate new dimensions maintaining aspect ratio
        let { width, height } = this.calculateDimensions(img.width, img.height, maxWidth, maxHeight);
        
        canvas.width = width;
        canvas.height = height;
        
        // Enable image smoothing for better quality at smaller sizes
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to JPEG with specified quality
        const compressedData = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedData);
      };
      img.onerror = () => resolve(null);
      img.src = imageData;
    });
  }

  // Calculate optimal dimensions maintaining aspect ratio
  calculateDimensions(originalWidth, originalHeight, maxWidth, maxHeight) {
    let width = originalWidth;
    let height = originalHeight;
    
    // Scale down if larger than maximum dimensions
    if (width > maxWidth) {
      height = (height * maxWidth) / width;
      width = maxWidth;
    }
    
    if (height > maxHeight) {
      width = (width * maxHeight) / height;
      height = maxHeight;
    }
    
    return { width: Math.round(width), height: Math.round(height) };
  }

  // Method to convert image file to base64 with compression (for product images only)
  async fileToBase64(file, compressForProduct = false) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          if (compressForProduct) {
            const compressed = await this.compressProductImage(reader.result);
            resolve(compressed || reader.result);
          } else {
            resolve(reader.result); // No compression for format images
          }
        } catch (error) {
          resolve(reader.result); // Fallback to original if compression fails
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Method to load image from URL (NO compression for format image, compression for product images)
  async loadImageFromUrl(url, isProductImage = false) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = async () => {
        try {
          if (isProductImage) {
            // Compress product images for table icons
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Calculate compressed dimensions for product images
            const { width, height } = this.calculateDimensions(
              img.width, 
              img.height, 
              this.maxProductImageWidth, 
              this.maxProductImageHeight
            );
            
            canvas.width = width;
            canvas.height = height;
            
            // Enable high-quality image smoothing
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            
            ctx.drawImage(img, 0, 0, width, height);
            
            // Use JPEG with compression for product images
            const compressedData = canvas.toDataURL('image/jpeg', this.productImageQuality);
            resolve(compressedData);
          } else {
            // For format/background images, convert to base64 without compression
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = img.width;
            canvas.height = img.height;
            
            ctx.drawImage(img, 0, 0);
            
            // Use original quality PNG/JPEG
            const imageData = canvas.toDataURL('image/jpeg', 1.0); // Maximum quality
            resolve(imageData);
          }
        } catch (error) {
          reject(error);
        }
      };
      img.onerror = reject;
      img.src = url;
    });
  }

  async addBackgroundFormat() {
    try {
      // Use absolute path for the background image
      const formatImagePath = '/format.jpg';
      
      let formatImageData;
      
      try {
        // Load format image WITHOUT compression to maintain quality
        formatImageData = await this.loadImageFromUrl(formatImagePath, false);
      } catch (imageError) {
        console.warn('Could not load format image from:', formatImagePath);
        throw imageError;
      }

      // Add the format image as full-page background (original quality)
      if (formatImageData) {
        this.doc.addImage(formatImageData, 'JPEG', 0, 0, this.pageWidth, this.pageHeight);
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
    
    const orderNumber = orderData.id || Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    const transportAgency = (orderData.transportName || transportData?.name || dispatchData?.transportName || 'N/A').toUpperCase();
    const deliveryTime = orderData.delivery_time || '10-15 DAYS';

    const orderDetails = [
      orderNumber,
      this.formatDate(orderData.created_at),
      (orderData.delivery_location || orderData.city || 'N/A').toUpperCase(),
      transportAgency,
      deliveryTime
    ];

    let detailY = startY;
    orderDetails.forEach(detail => {
      this.doc.text(detail, rightColumnX, detailY);
      detailY += 6;
    });
  }

  async overlayItemsTable(dispatchedItems, products = []) {
    // Table content positioning based on your format
    const tableStartY = 140;
    const rowHeight = 8;
    
    // Column positions matching your format
    const colPositions = {
      sr: 23,
      image: 50,
      particulars: 60,
      qty: 120,
      rate: 155,
      amount: 187
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

    if (!Array.isArray(items)) {
      console.warn('Dispatched items is not an array:', items);
      items = [];
    }
    
    // Cache for compressed product images to avoid reprocessing
    const productImageCache = new Map();
    
    for (let index = 0; index < items.length; index++) {
      const item = items[index];
      
      // SR
      this.doc.text((index + 1).toString(), colPositions.sr, rowY, { align: 'center' });
      
      // Product Image - Compressed and cached (ONLY product images are compressed)
      try {
        const product = products.find(p => p.id === item.productId || p.name === item.productName);
        if (product && product.image) {
          let productImageData;
          
          // Check cache first
          if (productImageCache.has(product.image)) {
            productImageData = productImageCache.get(product.image);
          } else {
            try {
              // Load and compress product image (small size for table) - THIS is compressed
              productImageData = await this.loadImageFromUrl(product.image, true);
              if (productImageData) {
                // Cache the compressed image
                productImageCache.set(product.image, productImageData);
              }
            } catch (imageError) {
              console.warn('Could not load product image:', product.image, imageError);
            }
          }
          
          if (productImageData) {
            // Add small product image icon (6x6mm)
            this.doc.addImage(productImageData, 'JPEG', colPositions.image, rowY - 3, 6, 6);
          }
        }
      } catch (error) {
        console.warn('Error processing product image:', error);
      }
      
      // Particulars
      const productName = item.productName || 'Unknown Product';
      this.doc.text(productName, colPositions.particulars, rowY);
      
      // Quantity
      const quantity = item.dispatchedQuantity || item.quantity || 0;
      this.doc.text(quantity.toString(), colPositions.qty, rowY, { align: 'center' });
      
      // Rate - Add rupee symbol
      const rate = item.price || 0;
      this.doc.text(`Rs. ${rate.toFixed(2)}`, colPositions.rate, rowY, { align: 'right' });
      
      // Amount - Add rupee symbol
      const amount = quantity * rate;
      this.doc.text(`Rs. ${amount.toFixed(2)}`, colPositions.amount, rowY, { align: 'right' });
    
      rowY += rowHeight;
    }
  }

  // Helper method to wrap text
  wrapText(text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    words.forEach(word => {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const textWidth = this.doc.getTextWidth(testLine);
      
      if (textWidth > maxWidth) {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          // Word is too long, force break
          lines.push(word);
        }
      } else {
        currentLine = testLine;
      }
    });

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
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

    if (!Array.isArray(items)) {
      console.warn('Dispatched items is not an array:', items);
      items = [];
    }

    // Calculate grand total
    const grandTotal = items.reduce((sum, item) => {
      const quantity = item.dispatchedQuantity || item.quantity || 0;
      const rate = item.price || 0;
      const itemTotal = quantity * rate;
      return sum + itemTotal;
    }, 0);
    
    // Amount in words with text wrapping
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(0, 0, 0);
    
    const amountInWords = `Rs. ${this.numberToWords(grandTotal)} only`;
    const maxWidth = 120; // Maximum width for the amount in words area
    const wrappedLines = this.wrapText(amountInWords, maxWidth);
    
    let startY = 226;
    const lineHeight = 4; // Space between lines
    
    // Display wrapped lines
    wrappedLines.forEach((line, index) => {
      this.doc.text(line, 25, startY + (index * lineHeight));
    });
    
    // Grand total amount with proper rupee symbol
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(255, 255, 255);
    
    // Use Rs. instead of ₹ symbol to ensure compatibility
    const totalText = `Rs. ${grandTotal.toLocaleString('en-IN')}/-`;
    this.doc.text(totalText, 165, 226, { align: 'center' });
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
      
      if (num >= 10000000) {
        const crores = Math.floor(num / 10000000);
        result += convertHundreds(crores) + ' Crore ';
        num %= 10000000;
      }
      
      if (num >= 100000) {
        const lakhs = Math.floor(num / 100000);
        result += convertHundreds(lakhs) + ' Lakh ';
        num %= 100000;
      }
      
      if (num >= 1000) {
        const thousands = Math.floor(num / 1000);
        result += convertHundreds(thousands) + ' Thousand ';
        num %= 1000;
      }
      
      if (num > 0) {
        result += convertHundreds(num);
      }
      
      return result.trim();
    }

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
export const generateDispatchPDF = async (orderData, dispatchData, customerData = null, transportData = null, products = []) => {
  const pdfGenerator = new PDFGenerator();

  const customer = customerData || {
    name: orderData.customer_name,
    city: orderData.city,
    phone: orderData.phone_number
  };

  const transport = transportData || {
    name: orderData.transportName || dispatchData.transportName || ''
  };

  return await pdfGenerator.generatePurchaseOrderPDF(orderData, dispatchData, customer, transport, products);
};

export default PDFGenerator;