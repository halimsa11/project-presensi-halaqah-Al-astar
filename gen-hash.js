import bcrypt from 'bcryptjs';
async function main() { 
  const h = await bcrypt.hash('@Alatsarsolo', 10);
  console.log('generated:', h);
} 
main();
