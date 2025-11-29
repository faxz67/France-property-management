const PDFDocument = require('pdfkit');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const FrenchBillTemplate = require('./frenchBillTemplate');

class PDFService {
  /**
   * Generate a PDF receipt for a bill
   * @param {Object} bill - Bill object with tenant, property, and admin data
   * @returns {Buffer} PDF buffer
   */
  static async generateReceipt(bill) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50
        });

        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfData = Buffer.concat(buffers);
          resolve(pdfData);
        });

        // Header
        doc.fontSize(20)
           .font('Helvetica-Bold')
           .text('QUITTANCE DE LOYER', { align: 'center' });

        doc.moveDown(0.5);

        // Company/Property Management Info
        doc.fontSize(12)
           .font('Helvetica')
           .text('Système de Gestion Immobilière', { align: 'center' });

        doc.moveDown(1);

        // Receipt Details
        const receiptDate = new Date().toLocaleDateString('fr-FR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

        doc.fontSize(14)
           .font('Helvetica-Bold')
           .text('Détails du reçu', { underline: true });

        doc.moveDown(0.3);

        // Receipt table
        const tableData = [
          ['Numéro de reçu:', `#${bill.id}`],
          ['Date:', receiptDate],
          ['Mois:', bill.month],
          ['Date d\'échéance:', new Date(bill.due_date).toLocaleDateString('fr-FR')],
          ['Statut:', bill.status],
          ['', ''], // Empty row
          ['Informations du locataire:', ''],
          ['Nom:', bill.tenant.name],
          ['Email:', bill.tenant.email || 'N/A'],
          ['Téléphone:', bill.tenant.phone || 'N/A'],
          ['', ''], // Empty row
          ['Informations de la propriété:', ''],
          ['Propriété:', bill.property.title],
          ['Adresse:', bill.property.address],
          ['Ville:', bill.property.city],
          ['', ''], // Empty row
          ['Détails du paiement:', ''],
          ['Montant:', `${parseFloat(bill.amount).toFixed(2)}€`],
          ['Description:', bill.description || 'Paiement du loyer mensuel']
        ];

        // Draw table
        let yPosition = doc.y;
        const rowHeight = 20;
        const col1Width = 150;
        const col2Width = 300;

        tableData.forEach((row, index) => {
          if (row[0] === '' && row[1] === '') {
            // Empty row
            yPosition += 10;
            return;
          }

          // Draw row background
          if (row[0].includes('Information:') || row[0].includes('Details:')) {
            doc.rect(50, yPosition, 500, rowHeight)
               .fill('#f0f0f0');
          }

          // Draw text
          doc.fontSize(10)
             .font('Helvetica-Bold')
             .text(row[0], 60, yPosition + 5, { width: col1Width });

          doc.font('Helvetica')
             .text(row[1], 60 + col1Width, yPosition + 5, { width: col2Width });

          yPosition += rowHeight;
        });

        // Move to bottom for signature
        doc.moveTo(50, yPosition + 20)
           .lineTo(550, yPosition + 20)
           .stroke();

        doc.fontSize(10)
           .font('Helvetica')
           .text('Signature', 50, yPosition + 30);

        doc.text('Date: _______________', 300, yPosition + 30);

        // Footer
        doc.fontSize(8)
           .text('This is a computer-generated receipt. No signature required.', 
                 { align: 'center', y: doc.page.height - 100 });

        doc.text(`Generated on ${new Date().toLocaleString()}`, 
                 { align: 'center', y: doc.page.height - 80 });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate a PDF for multiple bills (summary report)
   * @param {Array} bills - Array of bill objects
   * @param {Object} admin - Admin object
   * @returns {Buffer} PDF buffer
   */
  static async generateBillsSummary(bills, admin) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50
        });

        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfData = Buffer.concat(buffers);
          resolve(pdfData);
        });

        // Header
        doc.fontSize(20)
           .font('Helvetica-Bold')
           .text('BILLS SUMMARY REPORT', { align: 'center' });

        doc.moveDown(0.5);

        doc.fontSize(12)
           .font('Helvetica')
           .text(`Generated for: ${admin.name}`, { align: 'center' });

        doc.text(`Date: ${new Date().toLocaleDateString()}`, { align: 'center' });

        doc.moveDown(1);

        // Summary statistics
        const totalBills = bills.length;
        const totalAmount = bills.reduce((sum, bill) => sum + parseFloat(bill.amount), 0);
        const pendingBills = bills.filter(bill => bill.status === 'PENDING').length;
        const paidBills = bills.filter(bill => bill.status === 'PAID').length;
        const overdueBills = bills.filter(bill => bill.status === 'OVERDUE').length;

        doc.fontSize(14)
           .font('Helvetica-Bold')
           .text('Summary Statistics', { underline: true });

        doc.moveDown(0.3);

        const summaryData = [
          ['Total Bills:', totalBills.toString()],
          ['Total Amount:', `$${totalAmount.toFixed(2)}`],
          ['Pending Bills:', pendingBills.toString()],
          ['Paid Bills:', paidBills.toString()],
          ['Overdue Bills:', overdueBills.toString()]
        ];

        let yPosition = doc.y;
        const rowHeight = 20;
        const col1Width = 150;
        const col2Width = 100;

        summaryData.forEach((row) => {
          doc.fontSize(10)
             .font('Helvetica-Bold')
             .text(row[0], 60, yPosition + 5, { width: col1Width });

          doc.font('Helvetica')
             .text(row[1], 60 + col1Width, yPosition + 5, { width: col2Width });

          yPosition += rowHeight;
        });

        doc.moveDown(1);

        // Bills table
        doc.fontSize(14)
           .font('Helvetica-Bold')
           .text('Détails des factures', { underline: true });

        doc.moveDown(0.3);

        // Table headers
        const headers = ['ID', 'Locataire', 'Propriété', 'Montant', 'Mois', 'Statut', 'Date d\'échéance'];
        const colWidths = [40, 100, 120, 60, 80, 60, 80];

        yPosition = doc.y;
        let xPosition = 50;

        // Draw header background
        doc.rect(50, yPosition, 500, 25)
           .fill('#e0e0e0');

        headers.forEach((header, index) => {
          doc.fontSize(9)
             .font('Helvetica-Bold')
             .text(header, xPosition + 5, yPosition + 8, { width: colWidths[index] });
          xPosition += colWidths[index];
        });

        yPosition += 30;

        // Draw bills data
        bills.forEach((bill, index) => {
          if (yPosition > doc.page.height - 100) {
            doc.addPage();
            yPosition = 50;
          }

          const rowData = [
            bill.id.toString(),
            bill.tenant.name,
            bill.property.title,
            `$${parseFloat(bill.amount).toFixed(2)}`,
            bill.month,
            bill.status,
            new Date(bill.due_date).toLocaleDateString()
          ];

          xPosition = 50;
          rowData.forEach((cell, cellIndex) => {
            doc.fontSize(8)
               .font('Helvetica')
               .text(cell, xPosition + 5, yPosition + 5, { width: colWidths[cellIndex] });
            xPosition += colWidths[cellIndex];
          });

          yPosition += 20;
        });

        // Footer
        doc.fontSize(8)
           .text('Ceci est un rapport généré automatiquement.', 
                 { align: 'center', y: doc.page.height - 100 });

        doc.text(`Généré le ${new Date().toLocaleString('fr-FR')}`, 
                 { align: 'center', y: doc.page.height - 80 });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate a PDF bill (French format)
   * @param {Object} bill - Bill object with tenant, property, and admin data
   * @returns {string} PDF file path
   */
  static async generateBillPDF(bill) {
    return new Promise((resolve, reject) => {
      try {
        // Generate French bill content
        const frenchContent = FrenchBillTemplate.generateBillContent(bill);
        
        // Log landlord name for debugging
        console.log(`📄 PDF Generation - Landlord name: "${frenchContent.landlordInfo.name}"`);
        
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50,
          info: {
            Title: 'Facture de Loyer',
            Author: 'Système de Gestion Immobilière',
            Subject: `Facture ${bill.month}`,
            Creator: 'Système de Gestion Immobilière'
          }
        });

        // Create temporary file path
        const fileName = `bill_${bill.id}_${bill.month}_${Date.now()}.pdf`;
        const filePath = path.join(__dirname, '../uploads/bills', fileName);
        
        // Ensure temp directory exists
        const outDir = path.dirname(filePath);
        if (!require('fs').existsSync(outDir)) {
          require('fs').mkdirSync(outDir, { recursive: true });
        }

        // Create write stream
        const stream = require('fs').createWriteStream(filePath);
        doc.pipe(stream);

        // Header
        doc.fontSize(24)
           .font('Helvetica-Bold')
           .text(frenchContent.title, { align: 'center' });

        doc.moveDown(0.3);

        doc.fontSize(14)
           .font('Helvetica')
           .text(frenchContent.subtitle, { align: 'center' });

        doc.moveDown(1);

        // ============================================
        // PROFESSIONAL TWO-COLUMN LAYOUT
        // Left: Property Details | Right: Tenant Details
        // ============================================
        const sectionStartY = doc.y;

        // Get all data first for both sections
        const propertyName = bill.property?.title || frenchContent.propertyInfo?.name || 'Non renseigné';
        const propertyAddress = bill.property?.address || frenchContent.propertyInfo?.address || 'Non renseigné';
        const propertyCity = bill.property?.city || frenchContent.propertyInfo?.city || 'Non renseigné';
        const propertyPostalCode = bill.property?.postal_code || frenchContent.propertyInfo?.postalCode || '';
        const propertyCountry = bill.property?.country || frenchContent.propertyInfo?.country || 'France';
        
        const tenantName = frenchContent.tenantInfo.name || bill.tenant?.name || 'Non renseigné';
        const tenantEmail = frenchContent.tenantInfo.email || bill.tenant?.email || 'Non renseigné';
        const tenantPhone = frenchContent.tenantInfo.phone || bill.tenant?.phone || 'Non renseigné';
        const tenantAddress = frenchContent.tenantInfo.address || bill.tenant?.address || 'Non renseigné';
        
        // Log property data for debugging
        console.log(`🏠 [generateBillPDF] Property details for bill ${bill.id}:`, {
          name: propertyName,
          address: propertyAddress,
          city: propertyCity,
          postalCode: propertyPostalCode,
          country: propertyCountry,
          rawProperty: bill.property ? {
            id: bill.property.id,
            title: bill.property.title,
            address: bill.property.address,
            city: bill.property.city
          } : 'N/A',
          fromFrenchContent: frenchContent.propertyInfo?.name || 'N/A'
        });
        
        // ============================================
        // LEFT SIDE: Property Information
        // ============================================
        const leftX = 60;
        let propertyY = sectionStartY;
        
        // Property section title - left aligned
        doc.fontSize(11)
           .font('Helvetica-Bold')
           .text('ADRESSE DE LA LOCATION', leftX, propertyY);
        
        propertyY += 18;
        
        // Property name (title)
        if (propertyName && propertyName !== 'Non renseigné') {
          doc.fontSize(10)
             .font('Helvetica')
             .text(propertyName, leftX, propertyY);
          propertyY += 15;
        }
        
        // Property address
        if (propertyAddress && propertyAddress !== 'Non renseigné') {
          doc.fontSize(10)
             .font('Helvetica')
             .text(propertyAddress, leftX, propertyY, { width: 240 });
          propertyY += 15;
        }
        
        // City and postal code
        const cityLineParts = [];
        if (propertyCity && propertyCity !== 'Non renseigné') {
          cityLineParts.push(propertyCity);
        }
        if (propertyPostalCode) {
          cityLineParts.push(propertyPostalCode);
        }
        if (cityLineParts.length > 0) {
          doc.fontSize(10)
             .font('Helvetica')
             .text(cityLineParts.join(' '), leftX, propertyY);
          propertyY += 15;
        }
        
        // Country (only if not France)
        if (propertyCountry && propertyCountry !== 'France') {
          doc.fontSize(10)
             .font('Helvetica')
             .text(propertyCountry, leftX, propertyY);
          propertyY += 15;
        }
        
        const propertySectionHeight = propertyY - sectionStartY;
        
        // ============================================
        // RIGHT SIDE: Tenant Information
        // ============================================
        const rightAlignX = 60;
        const rightAlignWidth = 475;
        let tenantY = sectionStartY;
        
        // Tenant title - aligned to right
        doc.fontSize(11)
           .font('Helvetica-Bold')
           .text('LOCATAIRE', rightAlignX, tenantY, { 
             width: rightAlignWidth, 
             align: 'right' 
           });
        
        tenantY += 18;
        
        // Tenant name
        doc.fontSize(10)
           .font('Helvetica')
           .text(tenantName || 'Non renseigné', rightAlignX, tenantY, {
             width: rightAlignWidth,
             align: 'right'
           });
        tenantY += 15;
        
        // Tenant email
        if (tenantEmail && tenantEmail !== 'Non renseigné') {
          doc.fontSize(10)
             .font('Helvetica')
             .text(`Email: ${tenantEmail}`, rightAlignX, tenantY, {
               width: rightAlignWidth,
               align: 'right'
             });
          tenantY += 15;
        }
        
        // Tenant phone
        if (tenantPhone && tenantPhone !== 'Non renseigné') {
          doc.fontSize(10)
             .font('Helvetica')
             .text(`Téléphone: ${tenantPhone}`, rightAlignX, tenantY, {
               width: rightAlignWidth,
               align: 'right'
             });
          tenantY += 15;
        }
        
        // Tenant address (if provided)
        if (tenantAddress && tenantAddress !== 'Non renseigné') {
          doc.fontSize(10)
             .font('Helvetica')
             .text(`Adresse: ${tenantAddress}`, rightAlignX, tenantY, {
               width: rightAlignWidth,
               align: 'right'
             });
          tenantY += 15;
        }
        
        // Payment date (aligned right) - positioned right after tenant info
        const paymentDateText = frenchContent.paymentInfo.paymentDate;
        doc.fontSize(10)
           .font('Helvetica')
           .text(paymentDateText, rightAlignX, tenantY, {
             width: rightAlignWidth,
             align: 'right'
           });
        tenantY += 18;
        
        const tenantSectionHeight = tenantY - sectionStartY;
        
        // Update doc.y to continue from the bottom of the tallest section
        const maxSectionHeight = Math.max(propertySectionHeight, tenantSectionHeight);
        doc.y = sectionStartY + maxSectionHeight + 20;

        // Payment declaration text
        // Ensure tenant name is properly retrieved with fallback
        const declarationTenantName = frenchContent.tenantInfo.name || bill.tenant?.name || 'Non renseigné';
        
        doc.fontSize(10)
           .font('Helvetica')
           .text(
             `Je soussigné(e) ${frenchContent.landlordInfo.name}, propriétaire du logement désigné ci-dessus, déclare avoir reçu de Monsieur/Madame ${declarationTenantName}, la somme de ${frenchContent.billDetails.total.amount} euros (${frenchContent.billDetails.total.amount}), au titre du paiement du loyer du mois de ${frenchContent.billInfo.month} et lui en donne quittance, sous réserve de tous mes droits.`,
             60, 
             doc.y,
             { width: 480, align: 'justify' }
           );

        doc.moveDown(1.5);

        // Payment Details (Détail du règlement)
        doc.fontSize(12)
           .font('Helvetica-Bold')
           .text('Détail du règlement :', 60, doc.y, { underline: true });

        doc.moveDown(0.5);

        let yPosition = doc.y;
        const rowHeight = 18;
        const col1Width = 250;
        const col2Width = 150;

        // Loyer
        frenchContent.billDetails.items.forEach((item) => {
          doc.fontSize(10)
             .font('Helvetica')
             .text(`${item.description} :`, 80, yPosition, { width: col1Width });

          doc.text(`${item.amount} euros`, 80 + col1Width, yPosition, { width: col2Width, align: 'right' });

          yPosition += rowHeight;
        });

        // Empty row for (le cas échéant, contribution aux économies d'énergies)
        doc.fontSize(9)
           .font('Helvetica-Oblique')
           .text('(le cas échéant, contribution aux économies d\'énergies) :', 80, yPosition, { width: col1Width });
        doc.text('....... euros', 80 + col1Width, yPosition, { width: col2Width, align: 'right' });

        yPosition += rowHeight + 5;

        // Total
        doc.fontSize(11)
           .font('Helvetica-Bold')
           .text('Total :', 80, yPosition, { width: col1Width });

        doc.text(`${frenchContent.billDetails.total.amount} euros`, 80 + col1Width, yPosition, { width: col2Width, align: 'right' });

        doc.moveDown(2);

        // Signature section - with signature image if available
        const signatureLabelY = doc.y;
        doc.fontSize(12)
           .font('Helvetica-Bold')
           .fillColor('#2c3e50')
           .text('Signature du bailleur:', 50, signatureLabelY);

        // Compute signature image path from admin if available
        // Isolation: bill.admin.signature_photo is specific to the admin who created the bill
        let signatureBottomY = signatureLabelY + 25;
        let signatureImageRendered = false;
        
        // Debug: Log bill.admin structure
        console.log(`🔍 [generateBillPDF] Bill ${bill.id} - Admin check:`, {
          hasAdmin: !!bill.admin,
          adminId: bill.admin?.id,
          adminName: bill.admin?.name,
          hasSignaturePhoto: !!bill.admin?.signature_photo,
          signaturePhoto: bill.admin?.signature_photo
        });
        
        const signatureRelativePath = bill.admin && bill.admin.signature_photo
          ? bill.admin.signature_photo
          : null;

        if (signatureRelativePath) {
          // Normalize path separators (handle both / and \)
          const normalizedPath = signatureRelativePath.replace(/\\/g, '/');
          const signatureAbsolutePath = path.join(__dirname, '..', normalizedPath);
          
          console.log(`📝 [generateBillPDF] Checking signature file for admin ${bill.admin.id}:`);
          console.log(`   Relative path: ${normalizedPath}`);
          console.log(`   Absolute path: ${signatureAbsolutePath}`);
          console.log(`   File exists: ${fsSync.existsSync(signatureAbsolutePath)}`);
          
          if (fsSync.existsSync(signatureAbsolutePath)) {
            try {
              // Verify it's actually an image file
              const stats = fsSync.statSync(signatureAbsolutePath);
              if (!stats.isFile()) {
                console.warn(`⚠️ [generateBillPDF] Signature path is not a file: ${signatureAbsolutePath}`);
              } else {
                // Check file extension to ensure it's an image
                const ext = path.extname(signatureAbsolutePath).toLowerCase();
                const validExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.bmp'];
                
                if (!validExtensions.includes(ext)) {
                  console.warn(`⚠️ [generateBillPDF] Signature file has invalid extension: ${ext}`);
                } else {
                  console.log(`📸 [generateBillPDF] Rendering signature image...`);
                  console.log(`   File extension: ${ext}`);
                  console.log(`   File size: ${(stats.size / 1024).toFixed(2)} KB`);
                  console.log(`   Current doc.y position: ${doc.y}`);
                  
                  // Position signature image perfectly below the label (with proper spacing)
                  const imageY = signatureLabelY + 20; // Space after label
                  // Optimal size for signature in bill template (width: 150px, height: auto max 60px)
                  const imageOptions = { 
                    fit: [150, 60], 
                    align: 'left', 
                    valign: 'top'
                  };
                  
                  // Render the image - ensure we're at the right position
                  doc.y = imageY; // Set position before rendering
                  doc.image(signatureAbsolutePath, 50, imageY, imageOptions);
                  
                  // Adjust bottom position based on actual image height
                  signatureBottomY = imageY + 70; // Space for image + padding
                  signatureImageRendered = true;
                  
                  console.log(`✅ [generateBillPDF] Signature image rendered successfully!`);
                  console.log(`   Image Y position: ${imageY}`);
                  console.log(`   Signature bottom Y: ${signatureBottomY}`);
                  console.log(`   Image size: 150x60 (max)`);
                }
              }
            } catch (e) {
              console.error('❌ [generateBillPDF] Error rendering signature image:', e);
              console.error('Error details:', {
                message: e.message,
                stack: e.stack,
                filePath: signatureAbsolutePath,
                errorName: e.name,
                code: e.code
              });
              // Continue without signature image - don't break PDF generation
            }
          } else {
            console.warn(`⚠️ [generateBillPDF] Signature file not found: ${signatureAbsolutePath}`);
            console.warn(`   Check if file was moved or deleted`);
          }
        } else {
          console.log(`ℹ️ [generateBillPDF] No signature_photo found`);
          console.log(`   Admin ID: ${bill.admin?.id || 'N/A'}`);
          console.log(`   Admin object: ${bill.admin ? 'exists' : 'missing'}`);
          console.log(`   signature_photo value: ${bill.admin?.signature_photo || 'null/undefined'}`);
        }

        // Signature line under the image (or under label if no image)
        // Perfectly aligned horizontal line - only show if image was rendered
        if (signatureImageRendered) {
          // Line below the signature image
          doc.moveTo(50, signatureBottomY - 5)
             .lineTo(250, signatureBottomY - 5)
             .stroke('#2c3e50');

          // "Date et signature" text below the line
          doc.fontSize(10)
             .font('Helvetica')
             .fillColor('#6c757d')
             .text('Date et signature', 50, signatureBottomY);
        } else {
          // If no image, show line and text at default position
          doc.moveTo(50, signatureBottomY)
             .lineTo(250, signatureBottomY)
             .stroke('#2c3e50');

          doc.fontSize(10)
             .font('Helvetica')
             .fillColor('#6c757d')
             .text('Date et signature', 50, signatureBottomY + 5);
        }

        // Date and place on the right side, perfectly aligned
        doc.fontSize(11)
           .font('Helvetica')
           .fillColor('#495057')
           .text(frenchContent.paymentInfo.paymentDate, 300, signatureBottomY - 10);

        doc.moveDown(2);

        // Footer note removed as requested

        // Handle stream end
        stream.on('finish', () => {
          resolve(filePath);
        });

        stream.on('error', (error) => {
          reject(error);
        });

        doc.end();

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Stream a PDF bill directly to HTTP response (avoids temp files)
   * @param {Object} res - Express response
   * @param {Object} bill - Bill object with associations
   */
  static streamBillPDF(res, bill) {
    // Generate French bill content
    const frenchContent = FrenchBillTemplate.generateBillContent(bill);

    const doc = new PDFDocument({
      size: 'A4',
      margin: 40,
      info: {
        Title: 'Quittance de Loyer',
        Author: 'Système de Gestion Immobilière',
        Subject: `Quittance ${bill.month}`,
        Creator: 'Property Management System'
      }
    });

    // Set headers before piping
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="quittance-${bill.id}-${bill.month}.pdf"`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Pipe directly to response
    doc.pipe(res);

    // Professional Header with border
    doc.rect(40, 40, 515, 80).stroke('#333333');
    
    // Main Title
    doc.fontSize(28)
       .font('Helvetica-Bold')
       .fillColor('#2c3e50')
       .text(frenchContent.title, 50, 60, { align: 'center', width: 495 });

    // Subtitle
    doc.fontSize(16)
       .font('Helvetica')
       .fillColor('#34495e')
       .text(frenchContent.subtitle, 50, 95, { align: 'center', width: 495 });

    doc.moveDown(2);

    // Bill Information Section
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor('#2c3e50')
       .text('INFORMATIONS DE LA QUITTANCE', 50, doc.y);

    doc.moveDown(0.5);

    // Bill info in a professional table format
    const billInfo = [
      ['Numéro de quittance:', frenchContent.billInfo.billNumber],
      ['Date de la quittance:', frenchContent.billInfo.billDate],
      ['Date d\'échéance:', frenchContent.billInfo.dueDate],
      ['Période de loyer:', frenchContent.billInfo.month]
    ];

    let yPosition = doc.y;
    const rowHeight = 20;
    const col1Width = 150;
    const col2Width = 300;

    // Draw table background
    doc.rect(50, yPosition - 5, 495, billInfo.length * rowHeight + 10)
       .fillAndStroke('#f8f9fa', '#dee2e6');

    billInfo.forEach((row, index) => {
      const rowY = yPosition + (index * rowHeight);
      
      // Label
      doc.fontSize(11)
         .font('Helvetica-Bold')
         .fillColor('#495057')
         .text(row[0], 60, rowY + 5, { width: col1Width });

      // Value
      doc.font('Helvetica')
         .fillColor('#212529')
         .text(row[1], 60 + col1Width, rowY + 5, { width: col2Width });
    });

    doc.y = yPosition + (billInfo.length * rowHeight) + 20;

    // Three-column layout for landlord, tenant and property info
    const leftColumnX = 50;
    const middleColumnX = 220;
    const rightColumnX = 390;
    const columnWidth = 160;

    // Landlord Information (Left Column)
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor('#2c3e50')
       .text(frenchContent.landlordInfo.title, leftColumnX, doc.y);

    doc.moveDown(0.3);

    const landlordInfo = [
      ['Nom:', frenchContent.landlordInfo.name],
      ['Société:', frenchContent.landlordInfo.company],
      ['Ville:', `${frenchContent.landlordInfo.postalCode} ${frenchContent.landlordInfo.city}`],
      ['Pays:', frenchContent.landlordInfo.country]
    ];

    yPosition = doc.y;
    doc.rect(leftColumnX, yPosition - 5, columnWidth, landlordInfo.length * rowHeight + 10)
       .fillAndStroke('#e8f5e8', '#c8e6c9');

    landlordInfo.forEach((row, index) => {
      const rowY = yPosition + (index * rowHeight);
      
      doc.fontSize(9)
         .font('Helvetica-Bold')
         .fillColor('#2e7d32')
         .text(row[0], leftColumnX + 5, rowY + 3, { width: 50 });

      doc.font('Helvetica')
         .fillColor('#1b5e20')
         .text(row[1], leftColumnX + 60, rowY + 3, { width: 90 });
    });

    // Tenant Information (Middle Column)
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor('#2c3e50')
       .text(frenchContent.tenantInfo.title, middleColumnX, yPosition - 30);

    doc.moveDown(0.3);

    // Ensure tenant name is properly retrieved with fallback
    const tenantName = frenchContent.tenantInfo.name || bill.tenant?.name || 'Non renseigné';
    const tenantEmail = frenchContent.tenantInfo.email || bill.tenant?.email || 'Non renseigné';
    const tenantPhone = frenchContent.tenantInfo.phone || bill.tenant?.phone || 'Non renseigné';
    
    const tenantInfo = [
      ['Nom complet:', tenantName],
      ['Email:', tenantEmail],
      ['Téléphone:', tenantPhone]
    ];

    yPosition = doc.y;
    doc.rect(middleColumnX, yPosition - 5, columnWidth, tenantInfo.length * rowHeight + 10)
       .fillAndStroke('#e3f2fd', '#bbdefb');

    tenantInfo.forEach((row, index) => {
      const rowY = yPosition + (index * rowHeight);
      
      doc.fontSize(9)
         .font('Helvetica-Bold')
         .fillColor('#1565c0')
         .text(row[0], middleColumnX + 5, rowY + 3, { width: 50 });

      doc.font('Helvetica')
         .fillColor('#0d47a1')
         .text(row[1], middleColumnX + 60, rowY + 3, { width: 90 });
    });

    // Property Information (Right Column) - Title removed
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor('#2c3e50')
       .text('PROPRIÉTÉ', rightColumnX, yPosition - 30);

    const propertyInfo = [
      ['Propriété:', frenchContent.propertyInfo.name],
      ['Ville:', frenchContent.propertyInfo.city],
      ['Pays:', frenchContent.propertyInfo.country]
    ];

    doc.rect(rightColumnX, yPosition - 5, columnWidth, propertyInfo.length * rowHeight + 10)
       .fillAndStroke('#f3e5f5', '#e1bee7');

    propertyInfo.forEach((row, index) => {
      const rowY = yPosition + (index * rowHeight);
      
      doc.fontSize(9)
         .font('Helvetica-Bold')
         .fillColor('#7b1fa2')
         .text(row[0], rightColumnX + 5, rowY + 3, { width: 50 });

      doc.font('Helvetica')
         .fillColor('#4a148c')
         .text(row[1], rightColumnX + 60, rowY + 3, { width: 90 });
    });

    doc.y = yPosition + Math.max(landlordInfo.length, tenantInfo.length, propertyInfo.length) * rowHeight + 30;

    // Payment Details Section
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor('#2c3e50')
       .text(frenchContent.billDetails.title, 50, doc.y);

    doc.moveDown(0.5);

    // Professional payment table
    const tableStartY = doc.y;
    const tableWidth = 495;
    const itemColWidth = 350;
    const amountColWidth = 120;

    // Table header with professional styling
    doc.rect(50, tableStartY, tableWidth, 30)
       .fillAndStroke('#2c3e50', '#2c3e50');

    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor('#ffffff')
       .text('DÉTAIL DU RÈGLEMENT', 60, tableStartY + 8, { width: itemColWidth });

    doc.text('MONTANT', 60 + itemColWidth, tableStartY + 8, { width: amountColWidth, align: 'right' });

    // Bill items with alternating colors
    let currentY = tableStartY + 30;
    frenchContent.billDetails.items.forEach((item, index) => {
      const isEven = index % 2 === 0;
      const bgColor = isEven ? '#f8f9fa' : '#ffffff';
      
      doc.rect(50, currentY, tableWidth, 25)
         .fillAndStroke(bgColor, '#dee2e6');

      doc.fontSize(11)
         .font('Helvetica')
         .fillColor('#495057')
         .text(item.description, 60, currentY + 7, { width: itemColWidth });

      doc.font('Helvetica-Bold')
         .fillColor('#2c3e50')
         .text(`${item.amount} ${item.currency}`, 60 + itemColWidth, currentY + 7, { width: amountColWidth, align: 'right' });

      currentY += 25;
    });

    // Total row with emphasis
    doc.rect(50, currentY, tableWidth, 35)
       .fillAndStroke('#28a745', '#28a745');

    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor('#ffffff')
       .text(frenchContent.billDetails.total.label, 60, currentY + 10, { width: itemColWidth });

    doc.text(`${frenchContent.billDetails.total.amount} ${frenchContent.billDetails.total.currency}`, 
             60 + itemColWidth, currentY + 10, { width: amountColWidth, align: 'right' });

    doc.y = currentY + 50;

    // Payment Declaration Section
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor('#2c3e50')
       .text(frenchContent.paymentInfo.title, 50, doc.y);

    doc.moveDown(0.5);

    // Declaration box
    const declarationY = doc.y;
    doc.rect(50, declarationY, 495, 80)
       .fillAndStroke('#fff3cd', '#ffeaa7');

    doc.fontSize(11)
       .font('Helvetica')
       .fillColor('#856404')
       .text(frenchContent.paymentInfo.instructions[0], 60, declarationY + 15, { 
         width: 475, 
         align: 'justify' 
       });

    doc.moveDown(2);

    // Signature section - perfectly aligned at the bottom
    doc.moveDown(1);
    
    // Signature label
    const signatureLabelY = doc.y;
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor('#2c3e50')
       .text('Signature du bailleur:', 50, signatureLabelY);

    // Compute signature image path from admin if available
    // Isolation: bill.admin.signature_photo is specific to the admin who created the bill
    let signatureBottomY = signatureLabelY + 25;
    let signatureImageRendered = false;
    const signatureRelativePath = bill.admin && bill.admin.signature_photo
      ? bill.admin.signature_photo
      : null;

    if (signatureRelativePath) {
      // Normalize path separators (handle both / and \)
      const normalizedPath = signatureRelativePath.replace(/\\/g, '/');
      const signatureAbsolutePath = path.join(__dirname, '..', normalizedPath);
      console.log(`📝 [streamBillPDF] Checking signature file for admin ${bill.admin.id}:`);
      console.log(`   Relative path: ${normalizedPath}`);
      console.log(`   Absolute path: ${signatureAbsolutePath}`);
      console.log(`   File exists: ${fsSync.existsSync(signatureAbsolutePath)}`);
      
      if (fsSync.existsSync(signatureAbsolutePath)) {
        try {
          // Verify it's actually an image file
          const stats = fsSync.statSync(signatureAbsolutePath);
          if (!stats.isFile()) {
            console.warn(`⚠️ [streamBillPDF] Signature path is not a file: ${signatureAbsolutePath}`);
          } else {
            // Check file extension to ensure it's an image
            const ext = path.extname(signatureAbsolutePath).toLowerCase();
            const validExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.bmp'];
            
            if (!validExtensions.includes(ext)) {
              console.warn(`⚠️ [streamBillPDF] Signature file has invalid extension: ${ext}`);
            } else {
              console.log(`📸 [streamBillPDF] Rendering signature image...`);
              console.log(`   File extension: ${ext}`);
              console.log(`   File size: ${(stats.size / 1024).toFixed(2)} KB`);
              
              // Position signature image perfectly below the label (with proper spacing)
              const imageY = signatureLabelY + 20; // Space after label
              // Optimal size for signature in bill template (width: 150px, height: auto max 60px)
              const imageOptions = { 
                fit: [150, 60], 
                align: 'left', 
                valign: 'top'
              };
              
              // Render the image - ensure we're at the right position
              doc.y = imageY; // Set position before rendering
              doc.image(signatureAbsolutePath, 50, imageY, imageOptions);
              
              // Adjust bottom position based on actual image height
              signatureBottomY = imageY + 70; // Space for image + padding
              signatureImageRendered = true;
              
              console.log(`✅ [streamBillPDF] Signature image rendered successfully!`);
              console.log(`   Image Y position: ${imageY}`);
              console.log(`   Signature bottom Y: ${signatureBottomY}`);
            }
          }
        } catch (e) {
          console.error('❌ [streamBillPDF] Error rendering signature image:', e);
          console.error('Error details:', {
            message: e.message,
            stack: e.stack,
            filePath: signatureAbsolutePath,
            errorName: e.name,
            code: e.code
          });
          // Continue without signature image - don't break PDF generation
        }
      } else {
        console.warn(`⚠️ [streamBillPDF] Signature file not found: ${signatureAbsolutePath}`);
      }
    } else {
      console.log(`ℹ️ [streamBillPDF] No signature_photo found for admin ${bill.admin?.id || 'N/A'}`);
    }

    // Signature line under the image (or under label if no image)
    if (signatureImageRendered) {
      // Line below the signature image
      doc.moveTo(50, signatureBottomY - 5)
         .lineTo(250, signatureBottomY - 5)
         .stroke('#2c3e50');

      // "Date et signature" text below the line
      doc.fontSize(10)
         .font('Helvetica')
         .fillColor('#6c757d')
         .text('Date et signature', 50, signatureBottomY);
    } else {
      // If no image, show line and text at default position
      doc.moveTo(50, signatureBottomY)
         .lineTo(250, signatureBottomY)
         .stroke('#2c3e50');

      doc.fontSize(10)
         .font('Helvetica')
         .fillColor('#6c757d')
         .text('Date et signature', 50, signatureBottomY + 5);
    }

    // Date and place on the right side, perfectly aligned
    doc.fontSize(11)
       .font('Helvetica')
       .fillColor('#495057')
       .text(frenchContent.paymentInfo.paymentDate, 300, signatureBottomY - 10);

    doc.moveDown(2);

    // Professional footer
    doc.rect(40, doc.y, 515, 40)
       .fillAndStroke('#f8f9fa', '#dee2e6');

    doc.fontSize(9)
       .font('Helvetica')
       .fillColor('#6c757d')
       .text('Document généré automatiquement par le Système de Gestion Immobilière', 50, doc.y + 10, { align: 'center', width: 495 });

    doc.text(`Quittance générée le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, 50, doc.y + 25, { align: 'center', width: 495 });

    // Finalize
    doc.end();
  }
}

module.exports = PDFService;
