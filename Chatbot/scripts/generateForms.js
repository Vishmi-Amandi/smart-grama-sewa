const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const formsDir = path.join(__dirname, '../public/forms');
if (!fs.existsSync(formsDir)) {
  fs.mkdirSync(formsDir, { recursive: true });
}

const forms = [
  {
    filename: "residence_certificate_form.pdf",
    title: "Application for Residence Certificate",
    subtitle: "Department of Home Affairs, Sri Lanka"
  },
  {
    filename: "character_certificate_form.pdf",
    title: "Application for Character Certificate",
    subtitle: "Grama Niladhari Division"
  },
  {
    filename: "gn_certificate_application.pdf",
    title: "Grama Niladhari (GN) Certificate Application",
    subtitle: "General Purpose Certificate"
  },
  {
    filename: "nic_application_form.pdf",
    title: "National Identity Card (NIC) Application Form",
    subtitle: "Department of Registration of Persons"
  },
  {
    filename: "voter_registration_form.pdf",
    title: "Voter Registration Application",
    subtitle: "Election Commission of Sri Lanka"
  },
  {
    filename: "timber_transport_form.pdf",
    title: "Timber Transport Permit Application",
    subtitle: "Forest Department, Sri Lanka"
  },
  {
    filename: "samurdhi_application.pdf",
    title: "Samurdhi Beneficiary Application Form",
    subtitle: "Department of Samurdhi Development"
  },
  {
    filename: "income_verification_form.pdf",
    title: "Income Verification Form",
    subtitle: "For Mahapola and Bursary Applications"
  }
];

function createForm(formDef) {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(path.join(formsDir, formDef.filename));
    doc.pipe(stream);

    // Header
    doc.fontSize(18).font('Helvetica-Bold').text(formDef.title, { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(12).font('Helvetica').text(formDef.subtitle, { align: 'center' });
    doc.moveDown(2);
    
    // Official Use Box
    doc.rect(400, 40, 140, 60).stroke();
    doc.fontSize(9).text('For Official Use Only', 410, 50);
    doc.text('Date Received: _________', 410, 65);
    doc.text('Ref No: ________________', 410, 80);
    
    // Instructions
    doc.moveDown(3);
    doc.fontSize(10).font('Helvetica-Oblique').text('Instructions: Please fill this form in BLOCK LETTERS using a black or blue pen. Ensure all mandatory fields are completed accurately before submission.', { align: 'justify' });
    doc.moveDown(2);

    // Form Fields
    doc.fontSize(11).font('Helvetica-Bold').text('1. Applicant Details');
    doc.moveDown(1);
    doc.font('Helvetica');
    
    const drawField = (label) => {
      doc.text(label, 50, doc.y);
      doc.moveTo(180, doc.y + 10).lineTo(540, doc.y + 10).stroke();
      doc.moveDown(1.5);
    };

    drawField('1.1 Full Name:');
    drawField('1.2 Name with Initials:');
    drawField('1.3 NIC Number:');
    drawField('1.4 Date of Birth:');
    drawField('1.5 Gender:');
    drawField('1.6 Occupation:');
    
    doc.moveDown(1);
    doc.font('Helvetica-Bold').text('2. Contact Information');
    doc.moveDown(1);
    doc.font('Helvetica');
    
    drawField('2.1 Permanent Address:');
    drawField(''); // second line of address
    drawField('2.2 Mobile Number:');
    drawField('2.3 Email Address:');

    doc.moveDown(1);
    doc.font('Helvetica-Bold').text('3. Application Specifics');
    doc.moveDown(1);
    doc.font('Helvetica');
    drawField('Reason for Request:');
    drawField('');
    drawField('Supporting Docs:');

    // Declaration
    doc.moveDown(2);
    doc.fontSize(10).font('Helvetica-Oblique').text('Declaration: I hereby declare that the information provided above is true and correct to the best of my knowledge.');
    doc.moveDown(3);

    // Signatures
    doc.font('Helvetica');
    doc.moveTo(50, doc.y).lineTo(200, doc.y).stroke();
    doc.moveTo(390, doc.y).lineTo(540, doc.y).stroke();
    doc.moveDown(0.5);
    doc.text('Date', 110, doc.y);
    doc.text('Applicant Signature', 430, doc.y - 12);

    doc.end();
    stream.on('finish', resolve);
  });
}

async function generateAll() {
  console.log('Generating realistic forms...');
  for (const form of forms) {
    await createForm(form);
    console.log(`Created: ${form.filename}`);
  }
  console.log('Done.');
}

generateAll();
