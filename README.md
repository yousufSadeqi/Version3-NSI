 Version 3  – May 2025

What's New

Transaction Camera Modal Updated
The camera feature inside the transaction modal is now improved and fully functional for capturing receipt images directly.

Completed Profile Modals
  Finished implementing all profile-related sections:

  About
  Help & Support
  Password
  Privacy & Security

Stable Backend Connection
 Established a **stable connection** between the Python Flask server and the React Native frontend. The image is now sent directly from the app to the backend, ready for OCR processing.

---
Getting Started (for Testing)

1. Start the Flask Server
   Navigate to `/flask-server` and run:
   bash : python server.py

   If successful, it should run at: http://192.168.X.X:5000

2. Update IP Address (if needed)

   Go to `NSI/package.json` and set `"proxy"` to your local IP address.
   Then open `config/api.ts` and update the `BASE_URL` with your local IP (same as above).

3. Run the React Native App
   You should now be able to:

    Access the camera modal
    Capture and send receipts
    View the profile modals

---
 Known Issues

 Some camera interactions may still fail in certain cases (currently debugging).
 OCR accuracy and UI readability are still being improved.

