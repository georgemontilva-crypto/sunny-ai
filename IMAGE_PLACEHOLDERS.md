# Cloudflare R2 Image Integration Guide

This document tracks all image placeholders ready for Cloudflare R2 integration.

## Image Locations & Replacement Instructions

### 1. Hero Section Background
**File:** `client/src/components/landing/Hero.tsx`
**Current:** Commented out (lines ~12-18)
**Replacement:** Replace `https://your-r2-bucket.com/hero-background.jpg` with your R2 URL
**Dimensions:** Full width background, recommended 1920x1080px
**Purpose:** Hero background image with opacity overlay

### 2. Questions Cards (6 images)
**File:** `client/src/components/landing/Questions.tsx`
**Current:** `imageUrl: null` in each question object (lines ~7-26)
**Cards:**
- Sleep: `https://your-r2-bucket.com/sleep-peptide.jpg`
- Fat Loss: `https://your-r2-bucket.com/fat-loss-peptide.jpg`
- Recovery: `https://your-r2-bucket.com/recovery-peptide.jpg`
- Focus: `https://your-r2-bucket.com/focus-peptide.jpg`
- Libido: `https://your-r2-bucket.com/libido-peptide.jpg`
- Skin & Hair: `https://your-r2-bucket.com/hair-skin-peptide.jpg`
**Dimensions:** 400x160px (card header image)
**Purpose:** Category-specific visual indicators

### 3. Compounds Library (8 images)
**File:** `client/src/components/landing/Compounds.tsx`
**Current:** `imageUrl: null` in each compound object (lines ~6-31)
**Compounds:**
- BPC-157: `https://your-r2-bucket.com/bpc-157.jpg`
- TB-500: `https://your-r2-bucket.com/tb-500.jpg`
- Epitalon: `https://your-r2-bucket.com/epitalon.jpg`
- GHK-Cu: `https://your-r2-bucket.com/ghk-cu.jpg`
- MOTS-c: `https://your-r2-bucket.com/mots-c.jpg`
- Ipamorelin: `https://your-r2-bucket.com/ipamorelin.jpg`
- CJC-1295: `https://your-r2-bucket.com/cjc-1295.jpg`
- Semax: `https://your-r2-bucket.com/semax.jpg`
**Dimensions:** 400x128px (compound card header image)
**Purpose:** Compound visual representation

### 4. Goals Cards (6 images)
**File:** `client/src/components/landing/Goals.tsx`
**Current:** `imageUrl: null` in each goal object (lines ~6-31)
**Goals:**
- Recovery & Healing: `https://your-r2-bucket.com/recovery-goal.jpg`
- Fat Loss & Metabolic: `https://your-r2-bucket.com/fat-loss-goal.jpg`
- Cognition & Focus: `https://your-r2-bucket.com/cognition-goal.jpg`
- Longevity & Anti-Aging: `https://your-r2-bucket.com/longevity-goal.jpg`
- Performance & Growth: `https://your-r2-bucket.com/performance-goal.jpg`
- Sleep & Hormones: `https://your-r2-bucket.com/sleep-goal.jpg`
**Dimensions:** 400x160px (goal card header image)
**Purpose:** Goal category visual indicators

## Total Images Needed: 21
- 1 Hero background
- 6 Question category images
- 8 Compound images
- 6 Goal category images

## How to Replace Images

1. Upload images to Cloudflare R2
2. Get the public URL for each image
3. Replace the placeholder URLs in the respective component files
4. Example: Change `imageUrl: null,` to `imageUrl: "https://your-r2-bucket.com/image.jpg",`
5. For Hero background, uncomment the img tag and replace the URL
6. Test locally and deploy

## Image Style Guidelines

- **Format:** JPG or WebP for optimal compression
- **Color Scheme:** Align with desert palette (sand, cream, golden tones)
- **Style:** Minimalist, scientific, professional
- **Overlay:** Images will have slight opacity/overlay effects for text readability
- **Alt Text:** Already configured with category/compound names

## Note on sourcing (2026-07-29)

For anything that could read as real clinical/lab material (vials, syringes, lab
equipment, molecular diagrams presented as scientific figures), do not use
AI-generated images — use real licensed stock photography or nothing at all.
AI-generated imagery is fine for abstract/lifestyle/desert-palette visuals that
don't claim to depict real clinical content.
