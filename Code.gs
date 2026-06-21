/**
 * Google Apps Script Backend for AI-powered Blog Platform
 * Exposes doGet and doPost functions to handle CRUD and database access.
 */

// Name of the database file in Google Drive
var DATABASE_FILENAME = "database.json";
var PARENT_FOLDER_NAME = "Blog Platform";

function getOrCreateParentFolder() {
  var folders = DriveApp.getFoldersByName(PARENT_FOLDER_NAME);
  if (folders.hasNext()) {
    var folder = folders.next();
    folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return folder;
  } else {
    var newFolder = DriveApp.createFolder(PARENT_FOLDER_NAME);
    newFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return newFolder;
  }
}

/**
 * Handles GET requests (Read operations).
 * Expected parameter: action = 'getBlogs' | 'getBlogContent'
 */
function doGet(e) {
  try {
    var action = e.parameter.action;
    
    if (!action) {
      return makeJsonResponse({ success: false, error: "Missing action parameter" });
    }
    
    if (action === "getBlogs") {
      var dbFile = getOrCreateDatabaseFile();
      var contentStr = dbFile.getBlob().getDataAsString();
      var data = contentStr.trim() ? JSON.parse(contentStr) : [];
      return makeJsonResponse({ success: true, blogs: data });
    } 
    
    if (action === "getBlogContent") {
      var docId = e.parameter.docId;
      if (!docId) {
        return makeJsonResponse({ success: false, error: "Missing docId parameter" });
      }
      var content = getBlogDocContent(docId);
      return makeJsonResponse({ success: true, content: content });
    }
    
    return makeJsonResponse({ success: false, error: "Invalid action: " + action });
  } catch (err) {
    return makeJsonResponse({ success: false, error: err.toString() });
  }
}

/**
 * Handles POST requests (Create, Update, Delete operations).
 * Payload is sent as standard JSON inside a text/plain request body to bypass CORS preflight.
 */
function doPost(e) {
  try {
    if (!e.postData || !e.postData.contents) {
      return makeJsonResponse({ success: false, error: "No post data found" });
    }
    
    var payload = JSON.parse(e.postData.contents);
    var action = payload.action;
    
    if (!action) {
      return makeJsonResponse({ success: false, error: "Missing action in payload" });
    }
    
    var dbFile = getOrCreateDatabaseFile();
    var dbContent = dbFile.getBlob().getDataAsString();
    var dbData = dbContent.trim() ? JSON.parse(dbContent) : [];
    
    if (action === "create") {
      return handleCreate(payload, dbFile, dbData);
    } 
    
    if (action === "update") {
      return handleUpdate(payload, dbFile, dbData);
    } 
    
    if (action === "delete") {
      return handleDelete(payload, dbFile, dbData);
    }
    
    return makeJsonResponse({ success: false, error: "Invalid action: " + action });
  } catch (err) {
    return makeJsonResponse({ success: false, error: err.toString() });
  }
}

/**
 * Handles creation of a new blog post.
 * Images are now stored on Cloudinary CDN — the frontend sends a secure URL.
 */
function handleCreate(payload, dbFile, dbData) {
  var title = payload.title;
  var category = payload.category;
  var content = payload.content;
  var imageUrl = payload.imageUrl;   // Cloudinary CDN URL from frontend
  var slug = payload.slug;
  
  if (!title || !category || !content || !imageUrl || !slug) {
    return makeJsonResponse({ success: false, error: "Missing required fields for create" });
  }
  
  // 1. Create a public Google Doc with the blog text content
  var doc = DocumentApp.create(title);
  var body = doc.getBody();
  var paragraphs = content.split("\n");
  for (var i = 0; i < paragraphs.length; i++) {
    body.appendParagraph(paragraphs[i]);
  }
  doc.saveAndClose();
  
  var docFile = DriveApp.getFileById(doc.getId());
  var parentFolder = getOrCreateParentFolder();
  parentFolder.addFile(docFile);
  DriveApp.getRootFolder().removeFile(docFile);
  docFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  var docUrl = doc.getUrl();
  var docId = doc.getId();
  
  // 2. Store the Cloudinary image URL directly in the database
  var newPost = {
    id: Utilities.getUuid(),
    title: title,
    slug: slug,
    docUrl: docUrl,
    docId: docId,
    imageUrl: imageUrl,   // Cloudinary CDN URL — fast and reliable
    category: category,
    date: new Date().toISOString(),
    excerpt: content.length > 150 ? content.substring(0, 150) + "..." : content
  };
  
  dbData.push(newPost);
  dbFile.setContent(JSON.stringify(dbData, null, 2));
  
  return makeJsonResponse({ success: true, blog: newPost });
}

/**
 * Handles updating an existing blog post.
 * Images are stored on Cloudinary — frontend sends a URL if the image changed.
 */
function handleUpdate(payload, dbFile, dbData) {
  var id = payload.id;
  var title = payload.title;
  var category = payload.category;
  var content = payload.content;
  var slug = payload.slug;
  var imageUrl = payload.imageUrl;  // Optional: new Cloudinary URL if image was changed
  
  if (!id || !title || !category || !content || !slug) {
    return makeJsonResponse({ success: false, error: "Missing required fields for update" });
  }
  
  var index = -1;
  for (var i = 0; i < dbData.length; i++) {
    if (dbData[i].id === id) {
      index = i;
      break;
    }
  }
  
  if (index === -1) {
    return makeJsonResponse({ success: false, error: "Blog post not found" });
  }
  
  var post = dbData[index];
  
  // 1. Update the existing Google Doc content
  try {
    var doc = DocumentApp.openById(post.docId);
    var body = doc.getBody();
    body.clear();
    var paragraphs = content.split("\n");
    for (var j = 0; j < paragraphs.length; j++) {
      body.appendParagraph(paragraphs[j]);
    }
    doc.saveAndClose();
    DriveApp.getFileById(post.docId).setName(title);
  } catch (docErr) {
    // Doc was deleted — recreate it
    var newDoc = DocumentApp.create(title);
    var newBody = newDoc.getBody();
    var newParagraphs = content.split("\n");
    for (var k = 0; k < newParagraphs.length; k++) {
      newBody.appendParagraph(newParagraphs[k]);
    }
    newDoc.saveAndClose();
    var newDocFile = DriveApp.getFileById(newDoc.getId());
    newDocFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    post.docId = newDoc.getId();
    post.docUrl = newDoc.getUrl();
  }
  
  // 2. If a new Cloudinary image URL is provided, update it
  if (imageUrl && imageUrl.indexOf("http") === 0) {
    post.imageUrl = imageUrl;
  }
  
  // 3. Update metadata in database.json
  post.title = title;
  post.slug = slug;
  post.category = category;
  post.excerpt = content.length > 150 ? content.substring(0, 150) + "..." : content;
  post.lastUpdated = new Date().toISOString();
  
  dbData[index] = post;
  dbFile.setContent(JSON.stringify(dbData, null, 2));
  
  return makeJsonResponse({ success: true, blog: post });
}

/**
 * Handles deletion of a blog post.
 * Images are on Cloudinary and do not need to be deleted here.
 */
function handleDelete(payload, dbFile, dbData) {
  var id = payload.id;
  if (!id) {
    return makeJsonResponse({ success: false, error: "Missing post id" });
  }
  
  var index = -1;
  for (var i = 0; i < dbData.length; i++) {
    if (dbData[i].id === id) {
      index = i;
      break;
    }
  }
  
  if (index === -1) {
    return makeJsonResponse({ success: false, error: "Blog post not found" });
  }
  
  var post = dbData[index];
  
  // 1. Trash the associated Google Doc
  try {
    if (post.docId) {
      DriveApp.getFileById(post.docId).setTrashed(true);
    }
  } catch (e) {
    // Ignore if already deleted
  }
  
  // 2. Remove entry from database.json
  // (Image is on Cloudinary — no Drive file to clean up)
  dbData.splice(index, 1);
  dbFile.setContent(JSON.stringify(dbData, null, 2));
  
  return makeJsonResponse({ success: true });
}

/**
 * Helper to fetch and format Google Doc content as HTML.
 * Exports the doc via standard Google Drive HTML export url.
 */
function getBlogDocContent(docId) {
  var url = "https://docs.google.com/document/d/" + docId + "/export?format=html";
  var response = UrlFetchApp.fetch(url, {
    headers: {
      Authorization: "Bearer " + ScriptApp.getOAuthToken()
    },
    muteHttpExceptions: true
  });
  
  if (response.getResponseCode() !== 200) {
    throw new Error("Could not access blog content Document (" + response.getResponseCode() + ")");
  }
  
  var html = response.getContentText();
  
  // Extract content inside <body>
  var bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  var bodyHtml = bodyMatch ? bodyMatch[1] : html;
  
  // Extract CSS in <style> tag
  var styleMatch = html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi);
  var styleHtml = "";
  if (styleMatch) {
    styleHtml = styleMatch.join("\n");
  }
  
  return {
    body: bodyHtml,
    styles: styleHtml
  };
}

/**
 * Gets or creates the database.json file in the root of Google Drive.
 */
function getOrCreateDatabaseFile() {
  var parentFolder = getOrCreateParentFolder();
  var files = parentFolder.getFilesByName(DATABASE_FILENAME);
  while (files.hasNext()) {
    var file = files.next();
    var mime = file.getMimeType();
    // Skip spreadsheets or folders that happen to have the same name
    if (mime !== "application/vnd.google-apps.spreadsheet" && mime !== "application/vnd.google-apps.folder") {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      return file;
    }
  }
  // Create a new json database file if no valid text database file exists in the parent folder
  var newFile = parentFolder.createFile(DATABASE_FILENAME, "[]", "application/json");
  newFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return newFile;
}


/**
 * Utility function to build JSON responses with CORS headers.
 */
function makeJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
