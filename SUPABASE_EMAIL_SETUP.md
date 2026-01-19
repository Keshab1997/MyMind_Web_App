# Supabase Email Verification Setup Guide

## ১. Email Confirmation চালু করা

1. Supabase Dashboard এ যান: https://supabase.com/dashboard
2. আপনার প্রজেক্ট সিলেক্ট করুন
3. বাম মেনু থেকে **Authentication** ক্লিক করুন
4. **Providers** ট্যাবে যান
5. **Email** প্রোভাইডার খুঁজুন এবং এক্সপ্যান্ড করুন
6. **"Confirm email"** টগল ON করুন
7. **Save** বাটনে ক্লিক করুন

## ২. Site URL কনফিগার করা

1. **Authentication > URL Configuration** এ যান
2. **Site URL** ফিল্ডে আপনার GitHub Pages URL দিন:
   ```
   https://keshab1997.github.io/MyMind_Web_App/
   ```
3. **Redirect URLs** সেকশনে এই URL যোগ করুন:
   ```
   https://keshab1997.github.io/MyMind_Web_App/**
   ```
4. **Save** করুন

## ৩. Email Template (Optional)

1. **Authentication > Email Templates** এ যান
2. **Confirm signup** টেমপ্লেট সিলেক্ট করুন
3. চাইলে মেসেজ কাস্টমাইজ করতে পারেন
4. নিশ্চিত করুন যে `{{ .ConfirmationURL }}` লিংক আছে

## ৪. ইউজার কীভাবে ভেরিফাই করবে

**Sign Up করার পর:**
1. ইউজার তার ইমেইল চেক করবে (Inbox বা Spam ফোল্ডার)
2. "Confirm your email" লিংকে ক্লিক করবে
3. অটোমেটিক আপনার অ্যাপে রিডাইরেক্ট হবে
4. এখন লগইন করতে পারবে

## ৫. ম্যানুয়াল ভেরিফিকেশন (Testing এর জন্য)

যদি টেস্টিং এর সময় ইমেইল চেক না করতে চান:

1. **Authentication > Users** এ যান
2. ইউজার সিলেক্ট করুন
3. **"Confirm User"** বাটনে ক্লিক করুন
4. ইউজার সাথে সাথে ভেরিফাইড হয়ে যাবে

## ৬. গুরুত্বপূর্ণ নোট

- **Free Plan**: প্রতি ঘণ্টায় মাত্র 3টি ইমেইল পাঠানো যায়
- **Email Delivery**: কখনো কখনো 2-5 মিনিট সময় লাগতে পারে
- **Spam Folder**: ইউজারদের Spam ফোল্ডার চেক করতে বলুন
- **Production**: প্রোডাকশনে যাওয়ার আগে custom SMTP সেটআপ করা ভালো

## ৭. Custom SMTP Setup (Optional - Recommended for Production)

আরও ভালো email delivery এর জন্য:

1. **Settings > Auth** এ যান
2. **SMTP Settings** সেকশনে যান
3. Gmail/SendGrid/Mailgun এর SMTP credentials দিন
4. এতে email delivery আরও reliable হবে

## ৮. Troubleshooting

**ইমেইল আসছে না?**
- Spam ফোল্ডার চেক করুন
- 5-10 মিনিট অপেক্ষা করুন
- Free plan limit চেক করুন (3 emails/hour)
- ম্যানুয়ালি ভেরিফাই করে টেস্ট করুন

**Login করতে পারছে না?**
- নিশ্চিত করুন ইমেইল ভেরিফাই করা হয়েছে
- Dashboard থেকে user status চেক করুন
- Browser console এ error দেখুন
