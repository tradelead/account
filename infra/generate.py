from troposphere import Tags, ImportValue, Parameter, Sub, GetAtt, Ref, Join, Output, Export
from troposphere import Template
from troposphere import serverless, awslambda, s3, iam

t = Template()
t.add_version('2010-09-09')
t.add_transform('AWS::Serverless-2016-10-31')

# Parameters

t.add_parameter(Parameter('CoreStack', Type='String'))
t.add_parameter(Parameter('MySQLDbName', Type='String'))
t.add_parameter(Parameter('MySQLUser', Type='String'))
t.add_parameter(Parameter('MySQLPass', Type='String'))
t.add_parameter(Parameter('NodeEnv', Type='String'))
t.add_parameter(Parameter('KeycloakServerURL', Type='String'))
t.add_parameter(Parameter('KeycloakRealm', Type='String'))
t.add_parameter(Parameter('KeycloakClientID', Type='String'))
t.add_parameter(Parameter('KeycloakClientSecret', Type='String'))
t.add_parameter(Parameter('AwsKmsCmk', Type='String'))

# Create S3 Bucket
accountMediaBucket = t.add_resource(s3.Bucket(
    'AccountMedia',
    CorsConfiguration = s3.CorsConfiguration(CorsRules = [
        s3.CorsRules(
            AllowedHeaders = ['*'],
            AllowedMethods = ['GET', 'POST'],
            AllowedOrigins = ['*'],
        )
    ]),
))

# Lambda Variables

lambdaSrcPath = '../.'
lambdaHandlerPath = 'src/lambda/'
nodeRuntime = 'nodejs8.10'

lambdaVpcConfig = awslambda.VPCConfig(
    None,
    SecurityGroupIds=[
        ImportValue(Sub('${CoreStack}-RDS-Access-SG-ID')),
    ],
    SubnetIds=[ImportValue(Sub('${CoreStack}-SubnetID'))],
)

lambdaEnvVars = {
    'DATABASE_PORT': ImportValue(Sub('${CoreStack}-MySQL-Port')),
    'DATABASE_HOST': ImportValue(Sub('${CoreStack}-MySQL-Address')),
    'DATABASE_NAME': Ref('MySQLDbName'),
    'DATABASE_USER': Ref('MySQLUser'),
    'DATABASE_PASSWORD': Ref('MySQLPass'),
    'DATABASE_POOL_MIN': 1,
    'DATABASE_POOL_MAX': 2,
    'NODE_ENV': Ref('NodeEnv'),
    'KEYCLOAK_SERVER_URL': Ref('KeycloakServerURL'),
    'KEYCLOAK_REALM': Ref('KeycloakRealm'),
    'KEYCLOAK_CLIENT_ID': Ref('KeycloakClientID'),
    'KEYCLOAK_CLIENT_SECRET': Ref('KeycloakClientSecret'),
    'S3_BUCKET': accountMediaBucket.Ref(),
    'AWS_KMS_CMK': Ref('AwsKmsCmk'),
}

# Setup Resources

graphQL = serverless.Function('GraphQL')
graphQL.Runtime = nodeRuntime
graphQL.CodeUri = lambdaSrcPath
graphQL.Handler = lambdaHandlerPath + 'GraphQL.handler'
graphQL.Events = {
    'API': {
        'Type': 'Api',
        'Properties': {
            'Path': '/graphql',
            'Method': 'post'
        }
    }
}
graphQL.Policies = [
    'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
    {
        'Version': '2012-10-17',
        'Statement': [
            {
                'Effect': 'Allow',
                'Action': ['s3:PutObject', 's3:GetObject'],
                'Resource': [
                    accountMediaBucket.GetAtt('Arn'),
                    Sub('${AccountMedia.Arn}/*'),
                ],
            },
            {
                'Effect': 'Allow',
                'Action': 's3:PutBucketPublicAccessBlock',
                'Resource': accountMediaBucket.GetAtt('Arn')
            },
            {
                'Effect': 'Allow',
                'Action': ['kms:Decrypt', 'kms:Encrypt'],
                'Resource': Sub('arn:aws:kms:${AWS::Region}:${AWS::AccountId}:key/${AwsKmsCmk}'),
            },
        ],
    }
]
graphQL.VpcConfig = lambdaVpcConfig
graphQL.Environment = awslambda.Environment(None, Variables = lambdaEnvVars)
t.add_resource(graphQL)

uploadComplete = t.add_resource(serverless.Function(
    'UploadComplete',
    Runtime = nodeRuntime,
    CodeUri = lambdaSrcPath,
    Handler = lambdaHandlerPath + 'UploadComplete.handler',
    Policies = [
        'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
        {
            'Version': '2012-10-17',
            'Statement': [
                {
                    'Effect': 'Allow',
                    'Action': ['s3:PutObject', 's3:GetObject'],
                    'Resource': [
                        accountMediaBucket.GetAtt('Arn'),
                        Sub('${AccountMedia.Arn}/*'),
                    ],
                },
                {
                    'Effect': 'Allow',
                    'Action': 's3:PutBucketPublicAccessBlock',
                    'Resource': accountMediaBucket.GetAtt('Arn')
                },
            ],
        }
    ],
    VpcConfig = lambdaVpcConfig,
    Environment = awslambda.Environment(None, Variables = lambdaEnvVars),
))

t.add_resource(awslambda.Permission(
    'AccountMediaBucketInvokeUploadComplete',
    Action = 'lambda:InvokeFunction',
    FunctionName = uploadComplete.Ref(),
    Principal = 's3.amazonaws.com',
    SourceArn = accountMediaBucket.GetAtt('Arn')
))

def createExport(name, value, exportName):
    t.add_output(Output(
        name,
        Value = value,
        Export = Export(exportName)
    ))

createExport('AccountMediaBucket', accountMediaBucket.Ref(), Sub('${AWS::StackName}-AccountMediaBucket'))
createExport('UploadCompleteArn', uploadComplete.GetAtt('Arn'), Sub('${AWS::StackName}-UploadCompleteArn'))

# Save File

with open('template.yml', 'w') as f:
    f.write(t.to_yaml())
