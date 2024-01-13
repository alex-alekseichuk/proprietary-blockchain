Your README file for ng-css-theme

My first contract 

### Create distribution package

go to the Target Folder where the plugin code got generated and into the plugin folder

    npm i

Generate the distribution package. This will generate a zip file in folder ./dist with the same name as the plugin name

    npx project-dev gulp dist

### Upload the Plugin

    Signin as admin of your instance and install / activate the plugin via the Plugin Manager

### Upload the plugin via cli:
The app key is required for uploading plugins via CLI. Ensure you have the app key of your development system in your ~<home>/.project/config.json file. See developer tutorial guide for more info.
Then from the root of the plugin folder, type the following command to upload your plugin :
    
    npx project-dev plugin upload

### Running the generated plugin app locally


   unzip the distribution zip file into the plugin folder of your instance. i.e. ./plugins/customFolder

   and install / activate the plugin via the Plugin Manager
