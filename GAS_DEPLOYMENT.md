# Google Apps Script Deployment Guide

Follow these steps to deploy your Google Apps Script (GAS) backend as a serverless Web App and connect it to your React frontend.

---

## Step 1: Create the Apps Script Project
1. Open your browser and navigate to [Google Apps Script](https://script.google.com).
2. Click **New Project** in the upper left corner.
3. Rename the project from "Untitled project" to **Blog Platform Backend**.

---

## Step 2: Copy the Script Code
1. Open the [Code.gs](file:///c:/Users/krish/Documents/Blog%20Website/Code.gs) file in this workspace.
2. Select all of the code and copy it.
3. In the Apps Script editor, delete any default code inside the `Code.gs` tab and paste the copied code.
4. Save the project by clicking the **Save** icon (disk symbol) or pressing `Ctrl + S`.

---

## Step 3: Deploy as a Web App
1. In the upper-right corner of the Apps Script editor, click the blue **Deploy** button and select **New deployment**.
2. Click the gear icon next to **Select type** and choose **Web app**.
3. Fill out the configuration fields exactly as follows:
   - **Description**: `Serverless Blog API`
   - **Execute as**: **Me (your_email@gmail.com)** 
     *(This allows the script to read/write to your Google Drive and manage files using your storage and credentials)*
   - **Who has access**: **Anyone** 
     *(This is critical so your React frontend can send requests to the API without requiring users to log in)*
4. Click **Deploy**.

---

## Step 4: Authorize Google Scopes
1. A dialog will prompt you to authorize access. Click **Authorize access**.
2. Select your Google Account.
3. You may see an "Advanced" warning page because the app is not verified by Google. Click the small **Advanced** link at the bottom and choose **Go to Blog Platform Backend (unsafe)**.
4. Review the requested permissions:
   - *View and manage documents in Google Drive* (to write/update blog Google Docs)
   - *View and manage files in Google Drive* (to update database.json and upload thumbnails)
   - *Connect to external services* (to download HTML exports of Google Docs)
5. Click **Allow**.

---

## Step 5: Update the React Frontend Configuration
1. Once deployed, Google Apps Script will display a **New deployment** summary.
2. Under **Web app**, copy the **URL**. It will look similar to this:
   `https://script.google.com/macros/s/AKfycbw.../exec`
3. In this workspace, open the [.env](file:///c:/Users/krish/Documents/Blog%20Website/.env) file.
4. Paste your copied Web App URL into `VITE_GAS_API_URL`:
   ```env
   VITE_GAS_API_URL = "https://script.google.com/macros/s/AKfycbw.../exec"
   ```
5. Save the `.env` file.
6. Restart your React local development server (`npm run dev`) to load the new environment variable.

---

## Verification & First Run
- When you first load the React application with a configured URL, the script will automatically check for a `database.json` file in your Google Drive root. If it doesn't find one, it will create an empty `[]` file.
- When you create your first blog post, a folder called **Blog Images** will be created in your Google Drive to host your Gemini-generated thumbnails.
