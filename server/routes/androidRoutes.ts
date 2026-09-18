import { Router, Response } from 'express';
import crypto from 'crypto';
import JSZip from 'jszip';
import { db } from '../db';
import { authenticateUser, AuthenticatedRequest } from '../middleware/auth';
import { generateGeminiText } from '../gemini';
import { AndroidProject, ProjectFile } from '../types';

export const androidRouter = Router();

// POST /api/android/generate
androidRouter.post('/generate', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { prompt, title, packageName } = req.body;

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ error: 'Prompt is required to generate Android project.' });
    }

    const appName = title?.trim() || 'PrinceApp';
    const pkg = packageName?.trim() || 'com.princeai.app';
    const userId = req.user!.id;

    const aiPrompt = `Generate a structured Android native project (Kotlin & XML Views) for:
"${prompt}"
Package Name: ${pkg}
App Name: ${appName}

Provide Kotlin Activity code and XML layout definitions.`;

    const response = await generateGeminiText({
      prompt: aiPrompt,
      systemInstruction: 'You are PrinceAI Android Architect. Generate clean, idiomatic Android Kotlin code and Material XML layouts.',
    });

    const files: ProjectFile[] = [
      {
        name: 'MainActivity.kt',
        path: `app/src/main/java/${pkg.replace(/\./g, '/')}/MainActivity.kt`,
        language: 'kotlin',
        content: `package ${pkg}

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import android.widget.Button
import android.widget.TextView
import android.widget.Toast

class MainActivity : AppCompatActivity() {

    private lateinit var titleText: TextView
    private lateinit var actionButton: Button

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        titleText = findViewById(R.id.tvTitle)
        actionButton = findViewById(R.id.btnAction)

        titleText.text = "${appName}"

        actionButton.setOnClickListener {
            Toast.makeText(this, "Welcome to ${appName} - Crafted by PrinceAI", Toast.LENGTH_SHORT).show()
        }
    }
}`,
      },
      {
        name: 'activity_main.xml',
        path: 'app/src/main/res/layout/activity_main.xml',
        language: 'xml',
        content: `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:gravity="center"
    android:padding="24dp"
    android:background="#F8FAFC"
    tools:context=".MainActivity">

    <TextView
        android:id="@+id/tvTitle"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="${appName}"
        android:textSize="26sp"
        android:textStyle="bold"
        android:textColor="#0F172A"
        android:layout_marginBottom="12dp" />

    <TextView
        android:id="@+id/tvSubtitle"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="${prompt.slice(0, 80)}"
        android:textSize="15sp"
        android:textColor="#64748B"
        android:gravity="center"
        android:layout_marginBottom="32dp" />

    <Button
        android:id="@+id/btnAction"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="Get Started"
        android:paddingLeft="32dp"
        android:paddingRight="32dp"
        android:backgroundTint="#0284C7"
        android:textColor="#FFFFFF" />

</LinearLayout>`,
      },
      {
        name: 'AndroidManifest.xml',
        path: 'app/src/main/AndroidManifest.xml',
        language: 'xml',
        content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="${pkg}">

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.AppCompat.Light.NoActionBar">
        <activity
            android:name=".MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>

</manifest>`,
      },
      {
        name: 'build.gradle.kts',
        path: 'app/build.gradle.kts',
        language: 'kotlin',
        content: `plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
}

android {
    namespace = "${pkg}"
    compileSdk = 34

    defaultConfig {
        applicationId = "${pkg}"
        minSdk = 24
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
        }
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.appcompat:appcompat:1.6.1")
    implementation("com.google.android.material:material:1.11.0")
    implementation("androidx.constraintlayout:constraintlayout:2.1.4")
}`,
      },
      {
        name: 'strings.xml',
        path: 'app/src/main/res/values/strings.xml',
        language: 'xml',
        content: `<resources>
    <string name="app_name">${appName}</string>
</resources>`,
      },
    ];

    const project: AndroidProject = {
      id: 'and_' + crypto.randomBytes(6).toString('hex'),
      userId,
      title: appName,
      packageName: pkg,
      files,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.saveAndroidProject(project);
    return res.status(201).json({ project });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to generate Android project.' });
  }
});

// GET /api/android/projects
androidRouter.get('/projects', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  const projects = db.getAndroidProjects(req.user!.id);
  return res.json({ projects });
});

// GET /api/android/projects/:id
androidRouter.get('/projects/:id', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  const project = db.getAndroidProject(req.params.id, req.user!.id);
  if (!project) {
    return res.status(404).json({ error: 'Android project not found.' });
  }
  return res.json({ project });
});

// PUT /api/android/projects/:id
androidRouter.put('/projects/:id', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  const project = db.getAndroidProject(req.params.id, req.user!.id);
  if (!project) {
    return res.status(404).json({ error: 'Android project not found.' });
  }

  const { title, files } = req.body;
  if (title) project.title = title.trim();
  if (files && Array.isArray(files)) project.files = files;
  project.updatedAt = new Date().toISOString();

  db.saveAndroidProject(project);
  return res.json({ project });
});

// GET /api/android/projects/:id/zip
androidRouter.get('/projects/:id/zip', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const project = db.getAndroidProject(req.params.id, req.user!.id);
    if (!project) {
      return res.status(404).json({ error: 'Android project not found.' });
    }

    const zip = new JSZip();
    for (const file of project.files) {
      zip.file(file.path || file.name, file.content);
    }

    const buffer = await zip.generateAsync({ type: 'nodebuffer' });
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${project.title.replace(/\s+/g, '_')}_android.zip"`);
    return res.send(buffer);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to download Android ZIP.' });
  }
});
