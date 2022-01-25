Last week I was trying to find a solution to write a blog which can be written quickly, rendered faster and can be read with reasonable ease. I was evaluating  multiple off-the-shelf products like Wordpress, Zoomla, Drupal to validate whether they can provide all three features I was looking for. While these products are extremely popular as well as provide a pretty rich and easy to use user interface but all of those being server side, they will rely a lot on efficient hosting and nature of scaling. And within those limits there can be certain performance downside.

Since I use github a lot and like writing ReadMe instructions in Markdown text. The format has some distinct advantages. It provides semantic meaning for content in a relatively simple way and, there are useful shorthands and the final document is in plain text format occupying negligible space (few KBs) before its rendered in HTML. It's much difficult to write similar rich document in HTML format.

Also I am fond of serverless architecture and always try to modularise application components to be more reliable and scalable – so I started creating a design to write markdown text documents in [Stackedit](https://stackedit.io/) and save them in AWS S3 bucket. Then read them using APIs from a React component as text and then using a HTML parser to render that as DOM. Using a simple stylesheet you can make the markdown document looks quite good to read and the file can be cached easily at client side as it occupies just few KB of space. You can deploy the app using AWS amplify using auto deployment from git. With that you can take advantage of CloudFront distribution as well to get your content cached in edge locations for faster load from global readers. So effectively going forward you just need to upload your blog text to S3 rest will fall in place automatically.

Let's start building this in following steps

## Create an AWS S3 bucket
 - Create a S3 bucket and under **'Block public access**' uncheck the boxes for **'Block public access to buckets and objects granted through *new* access control lists (ACLs)**' and '**Block public access to buckets and objects granted through *any* access control lists (ACLs)**'

![enter image description here](https://taleofddh.s3-eu-west-1.amazonaws.com/images/blogs/technical/markdown-react-blog/clip_image001.png) 

## Enable Encryption at Rest
 - If you want to enable Encryption do so by using a **Custom managed KMS** key

![enter image description here](https://taleofddh.s3-eu-west-1.amazonaws.com/images/blogs/technical/markdown-react-blog/clip_image003.png)  

## Upload your markdown file
 - Upload your markdown text file into the bucket, Make sure to check the **Read** option enabled for AWS account holder/user

![enter image description here](https://taleofddh.s3-eu-west-1.amazonaws.com/images/blogs/technical/markdown-react-blog/clip_image004.png)

## Create an API with AWS Lambda
Let's create a Lamda serverless function to read the S3 object and deploy it inside API Gateway

- Create a handler function called getArticleDocument in handler.js file
```
    //handler.js
    const storage = require('./storage');
    const bucket = process.env['S3_BUCKET'];
    
    module.exports.getArticleDocument = async (event) => {  
        const data = JSON.parse(event.body);  
        const prefix = data.prefix;  
        const file = data.file;  
        let object = await storage.getObject({Bucket: bucket, Key: prefix + "/" + file});  
        return {  
            statusCode: 200,  
            body: JSON.stringify(object.Body.toString('utf-8')),  
            headers: {  
                "isBase64Encoded": true,  
                "Access-Control-Allow-Origin": "*",  
                "Access-Control-Allow-Credentials": true,  
                "Content-Type": object.ContentType  
            }  
        };  
    }
```
storage.js
```
    //storage.js
    var AWS = require('aws-sdk');  
      
    AWS.config.update({region: process.env['REGION']});
    
    module.exports.getObject = async (params) => {  
        // Create a new service object  
      let s3 = new AWS.S3({  
            apiVersion: '2006-03-01'  
      });  
      
        // for async it only works with Promise and resolve/reject  
      return new Promise((resolve, reject) => {  
            s3.getObject(params, (err, data) => {  
                if (err) {  
                    reject(err);  
                }  
                else {  
                    resolve(data);  
                }  
            });  
        });  
    }
```
- Deploy the function using serverless framework (```serverless deploy --stage prod```)
```
    #### serverless.yaml
    functions:  
      getArticleDocument:  
        handler: handler.getArticleDocument  
        events:  
          - http:  
              path: articleDocument  
              method: post  
              cors: true  
              contentHandling: CONVERT_TO_BINARY  
        environment:  
          S3_BUCKET: "taleofddh-blogs"  
      
    plugins:  
      - serverless-apigw-binary  
      - serverless-apigwy-binary  
      
    custom:  
      apigwBinary:  
        types:  
          - 'binary/octet-stream'
```
## Amend your IAM role policies

- Add following policy to your Lambda function Role
```
    {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Action": [
                    "s3:GetObject"
                ],
                "Resource": [
                    "arn:aws:s3:::{YOUR_BUCKET}/*"
                ],
                "Effect": "Allow"
            },
            {
                "Effect": "Allow",
                "Action": [
                    "kms:Decrypt"
                ],
                "Resource": [
                    "arn:aws:kms:::key/{YOUR_KMS_KEY}"
                ]
            }
        ]
    }
```
- Add following policy to Cognito Auth and Congito Unauth Roles
```
    {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                    "execute-api:Invoke"
                ],
                "Resource": [
                    "arn:aws:execute-api:eu-west-1:*:xaujl1oyul/*/POST/articleDocument"
                ]
            }
        ]
    }
```
## Prepare the client side application
Start with a React JS page and create a function make an AWS Amplify API call to your function
```
    import React, {useState} from 'react';
    import {API} from 'aws-amplify';
    import marked  from "marked";
    import ReactHtmlParser  from 'react-html-parser';
    import '../../scss/pages/article.scss';
    
    function Markdown(props) {
        const [markDown, setMarkDown] = useState([]);

    async function loadMdText(key) {
        await API.post(
            'getArticleDocument',
            '/articleDocument',
            {
                response: true,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: {prefix: key.substring(0, key.lastIndexOf('/')), file: key.substring(key.lastIndexOf('/') + 1)}
            }
        )
            .then(async response => {
            return await response.data
        })
            .then(text => {
                setMarkDown(marked(text));
            });
    }

    loadMdText(MDFILE_RELATIVE_PATH_INSIDE_BUCKET);

    return (
        <>
            <div className="articlemarkdown">{ReactHtmlParser(markDown)}</div>
        </>
    	)
    }
```
Look at 2 key functions in above code
- **marked** package to convert utf-8 markdown string into html string
- **ReactHtmlParser** function to convert the html string to React Rendered DOM 

In your stylesheet create a style block to modify the content
```
    .articlemarkdown {  
        padding: 0px 10px;  
        svg {  
            width: calc(50% - 160px);  
            padding: 20px 80px;  
            margin: 0 auto;  
            display: inline-block;  
            position: relative;  
        }  
        h2 {  
            font-family: Open Sans, Lucida Calligraphy, Sans-Serif;  
            font-size: 1.1rem;  
            font-weight: bold;  
            color: $color-crete;  
            padding: 10px 0px;  
            margin: 0 auto;  
            font-size-adjust: none;  
            font-stretch: normal;  
            line-height: 1.8rem;  
        }  
        ul {  
            margin: 0 auto;  
            li {  
                line-height: 1.67rem;  
                font-family: Open Sans, Sans-Serif;  
                font-size: 1rem;  
                font-weight: normal;  
                color: $color-abbey;  
            }  
        }  
        pre {  
            width: calc(100% - 20px);  
            background-color: $color-abbey;  
            padding: 5px 10px;  
            text-wrap: normal;  
            white-space: pre-wrap;       /* Since CSS 2.1 */  
            white-space: -moz-pre-wrap;  /* Mozilla, since 1999 */  
            white-space: -o-pre-wrap;    /* Opera 7 */  
            word-wrap: break-word;       /* Internet Explorer 5.5+ */  
            code {  
                color: $color-metallic-yellow;  
            }  
        }  
    }
```
We are done. Enjoy your blog (please note this article you are reading is a live example of the same)
