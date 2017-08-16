const chai = require('chai');
const chaiHttp = require('chai-http');
const should = chai.should();
const server = require('./server');
const fs = require('fs-extra');

chai.use(chaiHttp);
const API_PREFIX = '/v1';
const getToken = require('./getToken').getToken;
const ACCESS_KEY = require('./getToken').accessKey;

const binaryParser = (res, cb) => {
  res.setEncoding("binary");
  res.data = "";
  res.on("data", function (chunk) {
    res.data += chunk;
  });
  res.on("end", function () {
    cb(null, new Buffer(res.data, "binary"));
  });
};

describe('Objects', () => {
  describe('PUT /buckets/:id/objects/:objName', () => {
    describe('using invalid credentials', () => {
      it('should reject the request', (done) => {
        chai.request(server)
          .put(API_PREFIX + '/buckets/' + process.env.TEST_BUCKET_ID + '/objects/path/to/file.js')
          .set('authorization', 'ANY')
          .end((err, res) => {
            res.should.have.status(403);
            res.text.should.be.a('string');
            let resData = JSON.parse(res.text);
            resData.should.have.property('status');
            resData.status.should.be.equals('error');
            resData.should.have.property('msg');
            done();
          });
      });
    });

    describe('using valid credentials', () => {
      it('should accept the request and upload the file', (done) => {
        getToken('PUT', 'path/to/file.js')
          .then((token) => {
            chai.request(server)
              .put(API_PREFIX + '/buckets/' + process.env.TEST_BUCKET_ID + '/objects/path/to/file.js')
              .attach('file', fs.readFileSync('test/tokens.js'), 'tokens.js')
              .set('authorization', token)
              .set('user-agent', 'UserAgent')
              .end((err, res) => {
                res.should.have.status(200);
                res.text.should.be.a('string');
                let resData = JSON.parse(res.text);
                resData.should.have.property('status');
                resData.status.should.be.equals('ok');
                resData.should.not.have.property('msg');
                done();
              });
          });
      });
    });
  });

  describe('GET /buckets/:id/objects/:objName', () => {
    describe('using non-existent object name', () => {
      it('should not be available', (done) => {
        chai.request(server)
          .get(API_PREFIX + '/buckets/' + process.env.TEST_BUCKET_ID + '/objects/what-file.js')
          .end((err, res) => {
            res.should.have.status(404);
            res.text.should.be.a('string');
            let resData = JSON.parse(res.text);
            resData.should.have.property('status');
            resData.status.should.be.equals('error');
            resData.should.have.property('msg');
            done();
          });
      });
    });

    describe('using previously uploaded object name', () => {
      it('should not be available', (done) => {
        chai.request(server)
          .get(API_PREFIX + '/buckets/' + process.env.TEST_BUCKET_ID + '/objects/path/to/file.js')
          .buffer()
          .parse(binaryParser)
          .end((err, res) => {
            res.should.have.status(200);
            res.headers.should.have.property('content-type');
            res.headers['content-type'].should.be.equals('application/javascript');
            fs.readFile('test/tokens.js')
              .then((content) => {
                res.body.equals(content).should.be.equals(true);
                done();
              });
          });
      });
    });
  });

  describe('DELETE /buckets/:id/objects/:objName', () => {
    describe('using non-existent object name', () => {
      it('should simply return ok regardless', (done) => {
        chai.request(server)
          .delete(API_PREFIX + '/buckets/' + process.env.TEST_BUCKET_ID + '/objects/what-file.js')
          .set('authorization', ACCESS_KEY)
          .end((err, res) => {
            res.should.have.status(200);
            res.text.should.be.a('string');
            let resData = JSON.parse(res.text);
            resData.should.have.property('status');
            resData.status.should.be.equals('ok');
            done();
          });
      });
    });

    describe('using invalid access key', () => {
      it('should not be available', (done) => {
        chai.request(server)
          .delete(API_PREFIX + '/buckets/' + process.env.TEST_BUCKET_ID + '/objects/path/to/file.js')
          .set('authorization', 'none')
          .end((err, res) => {
            res.should.have.status(403);
            res.text.should.be.a('string');
            let resData = JSON.parse(res.text);
            resData.should.have.property('status');
            resData.status.should.be.equals('error');
            resData.should.have.property('msg');
            done();
          });
      });
    });
  });

});
