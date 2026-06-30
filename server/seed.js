import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin2@pme.com';
    const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || '00000000';
    const ADMIN_COMPANY_EMAIL = process.env.SEED_ADMIN_COMPANY_EMAIL || 'admin@pme.com';

    // Define Company schema inline
    const companySchema = new mongoose.Schema({
      name: { type: String, required: true, trim: true },
      taxId: { type: String, required: true },
      email: String,
      phone: String,
      address: String,
      logoUrl: String,
      settings: {
        currency: { type: String, default: 'DH' },
        defaultVat: { type: Number, default: 20 },
        quotePrefix: { type: String, default: 'DEVIS-' },
        invoicePrefix: { type: String, default: 'FACT-' },
      },
      createdAt: { type: Date, default: Date.now },
    });
    
    // Define User schema inline
    const userSchema = new mongoose.Schema({
      name: { type: String, required: true },
      email: { type: String, required: true, unique: true },
      password: { type: String, required: true },
      role: { type: String, enum: ['user', 'admin'], default: 'user' },
      company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: false },
      createdAt: { type: Date, default: Date.now }
    });

    const User = mongoose.model('User', userSchema);
    const Company = mongoose.model('Company', companySchema);

    const ensureAdminCompany = async () => {
      let company = await Company.findOne({ email: ADMIN_COMPANY_EMAIL });

      if (!company) {
        company = await Company.create({
          name: 'Admin Company',
          taxId: 'ADMIN-0001',
          email: ADMIN_COMPANY_EMAIL,
          settings: {
            currency: 'DH',
            defaultVat: 20,
            quotePrefix: 'DEVIS-',
            invoicePrefix: 'FACT-',
          },
        });
        console.log('Created company for admin user');
      }

      return company;
    };

    // Hash password once and use it for both create/update flows
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, salt);

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: ADMIN_EMAIL });
    if (existingAdmin) {
      const company = await ensureAdminCompany();
      existingAdmin.password = hashedPassword;
      existingAdmin.role = 'admin';
      existingAdmin.isVerified = true;
      if (!existingAdmin.company || String(existingAdmin.company) !== String(company._id)) {
        existingAdmin.company = company._id;
      }
      await existingAdmin.save();
      console.log('Updated existing admin credentials and company link');
      console.log('Admin user already exists');
      await mongoose.connection.close();
      process.exit(0);
    }

    const company = await ensureAdminCompany();

    // Create admin user
    const adminUser = await User.create({
      name: 'Admin User',
      email: ADMIN_EMAIL,
      password: hashedPassword,
      role: 'admin',
      isVerified: true,
      company: company._id,
    });

    console.log('Admin User Created Successfully!');
    console.log(`Email: ${ADMIN_EMAIL}`);
    console.log(`Password: ${ADMIN_PASSWORD}`);
    console.log('Role: admin');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error.message);
    process.exit(1);
  }
}

seed();