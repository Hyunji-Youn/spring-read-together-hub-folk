/**
 * 로컬 개발 환경을 위한 자체 서명 SSL 인증서 생성 스크립트
 * Run: node scripts/generate-certs.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 인증서 저장 디렉토리 경로
const certDir = path.join(__dirname, '../certs');

// 디렉토리가 없으면 생성
if (!fs.existsSync(certDir)) {
  fs.mkdirSync(certDir, { recursive: true });
  console.log(`📁 Created certificates directory: ${certDir}`);
}

// 인증서 파일 경로
const keyPath = path.join(certDir, 'server.key');
const certPath = path.join(certDir, 'server.cert');

try {
  // 이미 인증서가 있는지 확인
  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    console.log('⚠️ SSL certificates already exist.');
    console.log('🔑 Key file:', keyPath);
    console.log('📜 Certificate file:', certPath);
    
    // 사용자 확인 후 덮어쓰기
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    readline.question('Do you want to overwrite existing certificates? (y/n): ', (answer) => {
      if (answer.toLowerCase() === 'y') {
        generateCerts();
      } else {
        console.log('✅ Using existing certificates.');
      }
      readline.close();
    });
  } else {
    // 인증서가 없으면 바로 생성
    generateCerts();
  }
} catch (error) {
  console.error('❌ Error during certificate check:', error);
  process.exit(1);
}

/**
 * OpenSSL을 사용하여 자체 서명 인증서 생성
 */
function generateCerts() {
  try {
    console.log('🔐 Generating self-signed SSL certificates...');
    
    // OpenSSL 명령어 실행 - 자체 서명 인증서 생성
    const opensslCommand = `openssl req -nodes -new -x509 -keyout ${keyPath} -out ${certPath} -days 365 -subj "/CN=localhost"`;
    
    execSync(opensslCommand, { stdio: 'inherit' });
    
    console.log('✅ SSL certificates generated successfully:');
    console.log('🔑 Key file:', keyPath);
    console.log('📜 Certificate file:', certPath);
    console.log('\n⚠️ Note: Since this is a self-signed certificate, browsers will show a security warning.');
    console.log('   You\'ll need to accept the risk to proceed when accessing your local site.');
  } catch (error) {
    console.error('❌ Failed to generate SSL certificates:', error.message);
    console.error('\nPlease make sure OpenSSL is installed and available in your PATH.');
    console.error('You can install OpenSSL:');
    console.error('- Windows: Download from https://slproweb.com/products/Win32OpenSSL.html');
    console.error('- macOS: Use Homebrew with `brew install openssl`');
    console.error('- Linux: Use your distribution\'s package manager, e.g., `apt install openssl`');
    process.exit(1);
  }
} 