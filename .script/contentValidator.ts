import fs from "fs";
import { runCheckOverChangedFiles } from "./utils/changedFilesValidator";
import { ExitCode } from "./utils/exitCode";
import * as logger from "./utils/logger";

export async function ValidateFileContent(filePath: string): Promise<ExitCode> 
{
    const ignoreFiles = ["azure-pipelines", "azureDeploy", "host.json", "proxies.json", "azuredeploy", "function.json"]
    const requiredFolderFiles = ["/Data/", "/data/", "/DataConnectors/", "/Data Connectors/", "createUiDefinition.json"]

    const hasIgnoredFile = ignoreFiles.filter(item => { return filePath.includes(item)}).length > 0
    const hasRequiredFolderFiles = requiredFolderFiles.filter(item => { return filePath.includes(item)}).length > 0

    if (!hasIgnoredFile && hasRequiredFolderFiles)
    {
        const searchText = "Azure Sentinel";
        const expectedText = "Microsoft Sentinel";

        const fileContent = fs.readFileSync(filePath, "utf8");
        var fileContentObj = JSON.parse(fileContent);

        const jsonTagObj = JSON.parse(fs.readFileSync('./.script/validate-tag.json', "utf8"));

        let tagContent = "";
        let tagName = ""
        if (jsonTagObj.hasOwnProperty("createUiDefinition"))
        {
            console.log("aa")
            tagName = jsonTagObj.createUiDefinition;
            tagContent = GetTagContent(tagName);
        }
        else if (jsonTagObj.hasOwnProperty("data"))
        {
            console.log("bb")
            tagName = jsonTagObj.data;
            tagContent = GetTagContent(tagName);
        }
        else if (jsonTagObj.hasOwnProperty("dataConnectors"))
        {
            console.log("cc")
            tagName = jsonTagObj.dataConnectors;
            tagContent = GetTagContent(tagName);
        }
        console.log(`tagContent a: ${tagContent}`)
        if (tagContent)
        {
            console.log("dd")
            console.log(`tagContent b: ${tagContent}`)
            let hasAzureSentinelText = tagContent.toLowerCase().includes(searchText.toLowerCase());
            if (hasAzureSentinelText) {
                throw new Error(`Please update text from '${searchText}' to '${expectedText}' in '${tagName}' tag in the file '${filePath}'`);
            }
        }
    }

    return ExitCode.SUCCESS;

    function GetTagContent(tagName: any) {
        if (filePath.includes("createUiDefinition.json")) {
            var tagContent = fileContentObj["parameters"]["config"]["basics"][tagName];
            if (tagContent == undefined) {
                //MAKE FIRST LETTER OF THE WORD CAPS
                const firstLetterCapsInTagName = tagName.charAt(0).toUpperCase() + tagName.slice(1)
                var tagContent = fileContentObj["parameters"]["config"]["basics"][firstLetterCapsInTagName];
            }
        }
        else {
            var tagContent = fileContentObj[tagName];
            if (tagContent == undefined) {
                //MAKE FIRST LETTER OF THE WORD CAPS
                const firstLetterCapsInTagName = tagName.charAt(0).toUpperCase() + tagName.slice(1)
                var tagContent = fileContentObj[firstLetterCapsInTagName];
            }
        }
        return tagContent;
    }
}

let fileTypeSuffixes = ["json"];
let fileKinds = ["Added", "Modified"];
let CheckOptions = {
    onCheckFile: (filePath: string) => {
        return ValidateFileContent(filePath)
    },
    onExecError: async (e: any) => {
        logger.logError(`Content Validation check Failed: ${e.message}`);
    },
    onFinalFailed: async () => {
        logger.logError("An error occurred, please open an issue");
    },
};

runCheckOverChangedFiles(CheckOptions, fileKinds, fileTypeSuffixes);