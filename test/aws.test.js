import dotenv from 'dotenv';
import aws from '../src/libs/aws';
import config from '../src/configs/index';

dotenv.config();

config.extend({
  aws: {
    profileName: process.env.AWS_PROFILE_NAME,
    apiKey: process.env.AWS_ACCESS_KEY_ID,
    security: process.env.AWS_SECRET_ACCESS_KEY,
    bucketName: process.env.AWS_S3_BUCKET_NAME,
  },
});

describe('aws', () => {
  it('upload', async () => {
    console.log('done');
  });
  it('deleteObject', async () => {
    const result = await aws.deleteObject('resources/users/5c9206c71b9dec361eeaa157/media/original/b11e4444-4497-4589-87b7-e765b0d0267e.jpeg');
    expect(result).toEqual({});
  });
  it('deleteObjects', async () => {
    const result = await aws.deleteObjects(['resources/users/5c9206c71b9dec361eeaa157/media/thumbnail/015ec0ed-4169-495e-b4d8-a279076374be.jpeg', 'resources/users/5c9206c71b9dec361eeaa157/media/preview/015ec0ed-4169-495e-b4d8-a279076374be.jpeg', 'resources/users/5c9206c71b9dec361eeaa157/media/original/015ec0ed-4169-495e-b4d8-a279076374be.jpeg']);
    console.log('deleteObjects', result);
  });
});