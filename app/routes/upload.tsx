import { prepareInstructions } from "../../constants/index";
import { useState } from "react";
import { useNavigate } from "react-router";
import FileUploader from "~/components/FileUploader";
import Navbar from "~/components/Navbar";
import { convertPdfToImage } from "~/lib/pdf2img";
import { usePuterStore } from "~/lib/puter";
import { generateUUID } from "~/lib/utils";

const upload = () => {
    const {auth, isLoading, fs, ai,kv} = usePuterStore();
    const navigate = useNavigate();
    const [isProcessing, setIsProcessing] = useState(false);
    const [statusText, setStatusText] = useState('');
    const [file, setFile] = useState<File | null>(null);

    const handleAnalyze = async ({companyName, jobTitle, jobDescription, file}: {companyName: string, jobTitle: string, jobDescription: string, file: File}) => {
        setIsProcessing(true);
        setStatusText('Analyzing your resume...');
        const uploadedFile = await fs.upload([file]);
        if(!uploadedFile) return setStatusText('Failed to upload file');
        setStatusText('Converting the resume to image...');
        const imgFile = await convertPdfToImage(file);
        if(!imgFile.file) return setStatusText('Failed to convert PDF to image');
        setStatusText('Uploading the image...');
        const uploadedImage = await fs.upload([imgFile.file]);
        if(!uploadedImage) return setStatusText('Failed to upload image');

        setStatusText('Preparing your tailored data...');
        const uuid = generateUUID();
        const resumeData = {
            id: uuid,
            resumePath: uploadedFile.path,
            imagePath: uploadedImage.path,
            companyName,
            jobTitle,
            jobDescription,
            feedback: '',
            createdAt: new Date(),
        };
        await kv.set(`resume:${uuid}`, JSON.stringify(resumeData));
        setStatusText('Analyzing your resume...');
        const feedback = await ai.feedback(
            uploadedFile.path,
           prepareInstructions({jobTitle, jobDescription})
        );
        if(!feedback) return setStatusText('Failed to generate feedback');
        const feedbackText = typeof feedback.message.content === 'string' 
                             ? feedback.message.content 
                             : feedback.message.content[0].text;
        resumeData.feedback = JSON.parse(feedbackText);
         setStatusText('Analyzing your feedbac...');
        await kv.set(`resume:${uuid}`, JSON.stringify(resumeData));
        setStatusText('Your resume has been analyzed, redirecting....');
        console.log('data', resumeData)
        navigate(`/resume/${uuid}`);        
       
    }   

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget.closest('form');
        if (!form) return;
        const formData = new FormData(form);
        const companyName = formData.get('company-name') as string;
        const jobTitle = formData.get('job-title') as string;
        const jobDescription = formData.get('job-description') as string;
        if(!file) return;
        handleAnalyze({companyName, jobTitle, jobDescription, file});
    }

    const handleFileSelect = (file: File| null) =>{
        setFile(file);
    }
  return (
        <main className="bg-[url('/images/bg-main.svg')] bg-cover">
            <Navbar />

            <section className="main-section">
                <div className="page-heading py-16">
                    <h1>Smart feedback for your dream job</h1>
                    {isProcessing ? (
                        <>
                            <h2>{statusText}</h2>
                            <img src="/images/resume-scan.gif" className="w-full" />
                        </>
                    ) : (
                        <h2>Drop your resume for an ATS score and improvement tips</h2>
                    )}
                    {!isProcessing && (
                        <form id="upload-form" onSubmit={handleSubmit} className="flex flex-col gap-4 mt-8">
                            <div className="form-div">
                                <label htmlFor="company-name">Company Name</label>
                                <input type="text" name="company-name" placeholder="Company Name" id="company-name" />
                            </div>
                            <div className="form-div">
                                <label htmlFor="job-title">Job Title</label>
                                <input type="text" name="job-title" placeholder="Job Title" id="job-title" />
                            </div>
                            <div className="form-div">
                                <label htmlFor="job-description">Job Description</label>
                                <textarea rows={5} name="job-description" placeholder="Job Description" id="job-description" />
                            </div>

                            <div className="form-div">
                                <label htmlFor="uploader">Upload Resume</label>
                                <FileUploader onFileSelect={handleFileSelect} />
                            </div>

                            <button className="primary-button" type="submit">
                                Analyze Resume
                            </button>
                        </form>
                    )}
                </div>
            </section>
        </main>
  )
}

export default upload;