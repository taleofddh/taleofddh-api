
REM lambda-local -l app.js -e menu.json -E {\"MONGODB_ATLAS_CLUSTER_URI\":\"%1?retryWrites=true&w=majority\",\"DB_NAME\":\"%2\"}

REM lambda-local -l app.js -e promotion.json -E {\"MONGODB_ATLAS_CLUSTER_URI\":\"%1?retryWrites=true&w=majority\",\"DB_NAME\":\"%2\"}

REM lambda-local -l app.js -e aboutUs.json -E {\"MONGODB_ATLAS_CLUSTER_URI\":\"%1?retryWrites=true&w=majority\",\"DB_NAME\":\"%2\"}

REM lambda-local -l app.js -e termsAndConditions.json -E {\"MONGODB_ATLAS_CLUSTER_URI\":\"%1?retryWrites=true&w=majority\",\"DB_NAME\":\"%2\"}

REM lambda-local -l app.js -e privacyPolicy.json -E {\"MONGODB_ATLAS_CLUSTER_URI\":\"%1?retryWrites=true&w=majority\",\"DB_NAME\":\"%2\"}

REM lambda-local -l app.js -e frequentlyAskedQuestion.json -E {\"MONGODB_ATLAS_CLUSTER_URI\":\"%1?retryWrites=true&w=majority\",\"DB_NAME\":\"%2\"}

REM lambda-local -l app.js -e countryName.json -E {\"MONGODB_ATLAS_CLUSTER_URI\":\"%1?retryWrites=true&w=majority\",\"DB_NAME\":\"%2\"}

lambda-local -l app.js -e countryCode.json -E {\"MONGODB_ATLAS_CLUSTER_URI\":\"%1?retryWrites=true&w=majority&authSource=admin\",\"DB_NAME\":\"%2\"}