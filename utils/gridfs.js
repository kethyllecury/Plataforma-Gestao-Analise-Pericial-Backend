const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');

let gfs;
const inicializarGridFS = () => {
    const db = mongoose.connection.db;
    gfs = new GridFSBucket(db, { bucketName: 'arquivos' });
    return gfs;
};

const fazerUploadArquivoGridFS = (buffer, nomeArquivo, metadados) => {
    return new Promise((resolve, reject) => {
        const uploadStream = gfs.openUploadStream(nomeArquivo, { metadata: metadados });
        uploadStream.write(buffer);
        uploadStream.end();
        uploadStream.on('finish', () => resolve(uploadStream.id));
        uploadStream.on('error', (err) => reject(err));
    });
};

const obterArquivoGridFS = (arquivoId) => {
    return gfs.openDownloadStream(arquivoId);
};

module.exports = { inicializarGridFS, fazerUploadArquivoGridFS, obterArquivoGridFS };