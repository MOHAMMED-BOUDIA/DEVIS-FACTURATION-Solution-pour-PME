import fs from 'fs';

(async () => {
  try {
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin2@pme.com', password: '00000000', remember: false }),
    });
    const loginText = await loginRes.text();
    let login;
    try {
      login = JSON.parse(loginText);
    } catch (e) {
      console.error('Login response was not valid JSON. STATUS', loginRes.status);
      console.error('BODY:', loginText);
      process.exit(1);
    }
    const token = login.token;
    if (!token) {
      console.error('No token received:', login);
      process.exit(1);
    }

    const invoiceId = '69f09e0fbac5f779f1376dd0';
    const res = await fetch(`http://localhost:5000/api/invoices/${invoiceId}/pdf`, {
      headers: { Authorization: 'Bearer ' + token },
    });

    if (!res.ok) {
      console.error('Failed to fetch PDF. STATUS', res.status);
      console.error(await res.text());
      process.exit(1);
    }

    const arrayBuffer = await res.arrayBuffer();
    fs.writeFileSync('invoice.pdf', Buffer.from(arrayBuffer));
    console.log('Wrote backend/invoice.pdf');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
