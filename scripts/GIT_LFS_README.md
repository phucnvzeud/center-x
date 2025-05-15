# Git LFS Setup

This repository uses Git Large File Storage (LFS) to handle large binary files more efficiently. Git LFS replaces large files in your repository with text pointers while storing the actual file contents on a remote server.

## Files Tracked with Git LFS

This repository uses Git LFS to track the following file types:

- Images: `.png`, `.jpg`, `.jpeg`, `.gif`, `.svg`, `.ico`, `.webp`
- Documents: `.pdf`, `.psd`, `.ai`, `.docx`, `.xlsx`, `.pptx`
- Audio/Video: `.mp3`, `.mp4`, `.mov`, `.wav`, `.ogg`, `.webm`
- Archives: `.zip`, `.rar`, `.7z`, `.tar.gz`
- Fonts: `.ttf`, `.otf`, `.woff`, `.woff2`
- Other binary files: `.exe`, `.dll`, `.so`

## Setting Up Git LFS

If you're cloning this repository for the first time, follow these steps:

1. Install Git LFS:
   - For Windows: Install Git LFS using [Git for Windows](https://gitforwindows.org/) or run `choco install git-lfs`
   - For macOS: Run `brew install git-lfs`
   - For Linux: See [Git LFS installation instructions](https://github.com/git-lfs/git-lfs/wiki/Installation)

2. Clone the repository:
   ```
   git clone https://github.com/yourusername/center-v1.git
   cd center-v1
   ```

3. Set up Git LFS for your user account:
   ```
   git lfs install
   ```

4. Pull the LFS files:
   ```
   git lfs pull
   ```

## Working with Git LFS

- Git LFS automatically handles tracked file types.
- Regular Git commands (`git add`, `git commit`, `git push`) work as normal.
- To add a new file type to be tracked by Git LFS:
  ```
  git lfs track "*.extension"
  git add .gitattributes
  git commit -m "Track *.extension files with Git LFS"
  ```

## Troubleshooting

If you encounter issues with Git LFS:

1. Make sure Git LFS is installed: `git lfs install`
2. Try pulling LFS files: `git lfs pull`
3. Check LFS status: `git lfs status`
4. Fetch specific LFS files: `git lfs fetch --all`

For more information, visit the [Git LFS documentation](https://git-lfs.github.com/). 