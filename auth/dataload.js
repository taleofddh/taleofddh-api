import dotenv from 'dotenv';

dotenv.config();

console.log('Starting data loading process...');

// Import and run dataload scripts in sequence
try {
    console.log('Loading community and role data...');
    await import('./dataload1.js');
    
    console.log('Loading user profile data...');
    await import('./dataload2.js');
    
    console.log('Loading user and user role data...');
    await import('./dataload3.js');
    
    console.log('Data loading process completed successfully.');
} catch (error) {
    console.error('Error during data loading process:', error);
    process.exit(1);
}