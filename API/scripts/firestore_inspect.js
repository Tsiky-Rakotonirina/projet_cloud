const admin = require('firebase-admin');
const path = require('path');

async function main(){
  try{
    const serviceAccount = require(path.join(__dirname,'..','src','config','firebase-admin-sdk.json'));
    if(!admin.apps.length){
      admin.initializeApp({credential: admin.credential.cert(serviceAccount)});
    }
    const db = admin.firestore();
    const usersSnap = await db.collection('users').get();
    console.log('FIRESTORE_USERS_COUNT', usersSnap.size);
    usersSnap.docs.slice(0,20).forEach(doc=>{
      console.log('DOC', doc.id, doc.data());
    });
    // list mappings count from DB via console cannot be done here
    process.exit(0);
  }catch(e){
    console.error('ERR', e.message||e);
    process.exit(2);
  }
}

main();
