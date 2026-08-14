import { FileUploader } from '@aws-amplify/ui-react-storage';
import '@aws-amplify/ui-react/styles.css';
import './FileUploader.css';

export const UploadManifestFile = () => {
    return (
        <FileUploader
            acceptedFileTypes={[
                '.csv',
            ]}
            path="stowPlans/cargoUnits/"
            maxFileCount={1}
            isResumable
            displayText={{
                dropFilesText: 'Drag and drop your CSV file here, or...',
                browseFilesText: 'Browse Files',
            }}
        />
    );
};
