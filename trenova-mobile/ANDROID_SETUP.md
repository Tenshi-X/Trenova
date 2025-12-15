# Android Environment Setup Guide

It appears that the Android SDK and Emulator tools are not installed or configured on this machine. You have three main options to run your Trenova Mobile app:

## Option 1: Use Your Physical Device (Recommended & Easiest)
You can run the app on your real Android phone without installing Android Studio.

1.  **Install "Expo Go"** from the Google Play Store on your Android phone.
2.  Ensure your phone and computer are on the **same Wi-Fi network**.
3.  In the terminal, run:
    ```powershell
    npm start
    ```
4.  Scan the QR code shown in the terminal with the Expo Go app.

## Option 2: Run in Web Browser
If you just want to see the UI, you can run it as a web app.

1.  In the terminal, run:
    ```powershell
    npm run web
    ```
2.  The app will open in your default browser.

## Option 3: Install Android Studio (To use Emulator)
If you specifically need an Emulator on your PC:

1.  **Download Android Studio**: [https://developer.android.com/studio](https://developer.android.com/studio)
2.  **Install it**: Run the installer. During installation, make sure to check the boxes for:
    *   Android SDK
    *   Android SDK Platform
    *   Android Virtual Device
3.  **Open Android Studio**:
    *   Go to **More Actions** > **Virtual Device Manager**.
    *   Click **Create Device**.
    *   Choose a phone (e.g., Pixel 6) and click **Next**.
    *   Download a system image (e.g., UpsideDownCake or Tiramisu) next to the release name.
    *   Finish the setup.
4.  **Set Environment Variables** (Important):
    *   Add the Android SDK platform-tools to your Path.
    *   Usually located at: `%LOCALAPPDATA%\Android\Sdk\platform-tools`
5.  **Restart your Terminal** completely.
6.  Run `npm run android` again.

> [!NOTE]
> Since I cannot install system software for you, you will need to perform the installation of Android Studio manually (Option 3).
