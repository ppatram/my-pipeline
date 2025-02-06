import * as cdk from "aws-cdk-lib";
import * as codebuild from "aws-cdk-lib/aws-codebuild";
import * as codedeploy from "aws-cdk-lib/aws-codedeploy";
import * as pipeline from "aws-cdk-lib/aws-codepipeline";
import * as pipelineactions from "aws-cdk-lib/aws-codepipeline-actions";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as elb from "aws-cdk-lib/aws-elasticloadbalancingv2";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as custom from "aws-cdk-lib/custom-resources";
import { Construct } from "constructs";
import * as path from "path";
import * as fs from 'fs';
import { Asset } from 'aws-cdk-lib/aws-s3-assets';
import { IgnoreMode } from 'aws-cdk-lib';
import * as secrets from 'aws-cdk-lib/aws-secretsmanager';
import * as connection from 'aws-cdk-lib/aws-codestarconnections';
import * as codestar  from 'aws-cdk-lib/aws-codestar';


export class CodepipelineBuildDeployStackTest extends cdk.Stack {
  
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // modify gitignore file to remove unneeded files from the git copy    
    let gitignore = fs.readFileSync('.gitignore').toString().split(/\r?\n/);
    gitignore.push('.git/');
    gitignore = gitignore.filter(g => g != 'node_modules/');
    gitignore.push('/node_modules/');
    
    const codeAsset = new Asset(this, 'SourceAsset', {
      path: path.join(__dirname, "../"),
      ignoreMode: IgnoreMode.GIT,
      exclude: gitignore,
    });

    /*
    const codeStarConnection = new connection.CfnConnection(this, 'codeStarConnection', {
      connectionName: 'github-connection',      
    });

    */

    const githubSourceAction= new pipelineactions.CodeStarConnectionsSourceAction({
      actionName: 'githubSourceAction',
      connectionArn: 'arn:aws:codeconnections:us-east-1:676206914581:connection/38a41c14-fcf2-44f5-8784-908f4c33cc4d',
      owner: 'ppatram',
      repo: 'my-pipeline',
      branch: 'main',
      output: new pipeline.Artifact("SourceArtifact"),
      triggerOnPush: true,
      });


     
    // Creates the source stage for CodePipeline
    const sourceStage = {
      stageName: "Source",
      actions: [githubSourceAction],
    };


    // CodeBuild project that builds the Docker image
    const buildProject = new codebuild.Project(this, "buildProject", {
      source: codebuild.Source.gitHub({
        owner: 'ppatram',
        repo: 'my-pipeline',
        branchOrRef: 'main',
       
      })
    });     


    // Run jest test and send result to CodeBuild    
    const testStage = {
      stageName: "Test",
      actions: [
        new pipelineactions.CodeBuildAction({
          actionName: "JestCDK",
          input: new pipeline.Artifact("SourceArtifact"),
          project: buildProject,
        }),
      ],
    };

    // Creates an AWS CodePipeline with source, build, and deploy stages
    new pipeline.Pipeline(this, "BuildDeployPipelineTest", {
      pipelineName: "ImageBuildDeployPipelineTest",
      stages: [sourceStage, testStage],
    });

    
  }

}
