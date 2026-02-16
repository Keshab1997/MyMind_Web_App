# 📁 Nested Spaces Feature - সম্পূর্ণ গাইড

## 🎯 কী যোগ হলো?

তোমার My Mind অ্যাপে এখন **Nested Spaces** (ফোল্ডার সিস্টেম) যোগ হয়েছে! এটি দিয়ে তুমি:

- ✅ ফোল্ডার তৈরি করতে পারবে
- ✅ ফোল্ডারের ভেতর আরও সাব-ফোল্ডার তৈরি করতে পারবে (unlimited depth)
- ✅ তোমার saved links/notes গুলো organize করতে পারবে
- ✅ Breadcrumb navigation দিয়ে সহজে navigate করতে পারবে

## 📂 File Structure

```
MyMind_Web_App/
├── features/
│   └── spaces/
│       ├── index.html      # Spaces UI
│       ├── script.js       # Nested folder logic
│       └── style.css       # Folder card design
├── SPACES_SETUP.md         # Database setup guide
└── NESTED_SPACES.md        # This file
```

## 🗄️ Database Setup

### Step 1: Supabase SQL Editor এ যাও

1. Supabase Dashboard খোলো
2. বাম sidebar থেকে **SQL Editor** ক্লিক করো
3. **New Query** বাটনে ক্লিক করো

### Step 2: SQL Code Run করো

`SPACES_SETUP.md` ফাইলে থাকা SQL code copy করে paste করো এবং **RUN** করো।

এটি তৈরি করবে:
- `spaces` table (nested folders এর জন্য)
- `mind_links` table এ `space_id` column যোগ করবে
- Row Level Security (RLS) policies সেটআপ করবে

## 🎨 Features Breakdown

### 1. Root Level Spaces

প্রথমে তুমি root level এ spaces দেখবে:

```
All Spaces
├── 📁 Work
├── 📁 Personal
└── 📁 Learning
```

### 2. Nested Sub-folders

যেকোনো folder এ ক্লিক করলে তার ভেতরে ঢুকবে এবং আবার নতুন sub-folder তৈরি করতে পারবে:

```
All Spaces > Work
├── 📁 Projects
│   ├── 📁 Client A
│   └── 📁 Client B
├── 📁 Meetings
└── 📁 Documents
```

### 3. Breadcrumb Navigation

উপরে breadcrumb দেখাবে তুমি কোথায় আছো:

```
All Spaces > Work > Projects > Client A
```

যেকোনো breadcrumb item এ ক্লিক করলে সেখানে চলে যাবে।

### 4. Move Items to Spaces

Detail page থেকে যেকোনো saved link/note কে space এ move করতে পারবে:

1. যেকোনো item খোলো
2. নিচে "Spaces" বাটনে ক্লিক করো
3. যে space এ রাখতে চাও সেটা select করো

## 🔧 Technical Implementation

### Database Schema

```sql
spaces
├── id: UUID (Primary Key)
├── name: TEXT
├── parent_id: UUID (Foreign Key → spaces.id) [NULL = root]
├── user_id: UUID (Foreign Key → auth.users.id)
├── created_at: TIMESTAMP
└── updated_at: TIMESTAMP

mind_links
└── space_id: UUID (Foreign Key → spaces.id) [NULL = not in space]
```

### Key Logic

**Folder Navigation:**
```javascript
let currentParentId = null;  // Current folder ID
let folderPath = [];         // Breadcrumb trail

// Open folder
function openFolder(folder) {
    folderPath.push({ id: folder.id, name: folder.name });
    currentParentId = folder.id;
    loadSpaces();
}

// Go back
function goBack() {
    folderPath.pop();
    currentParentId = folderPath.length > 0 ? 
        folderPath[folderPath.length - 1].id : null;
    loadSpaces();
}
```

**Load Spaces Query:**
```javascript
// Get folders at current level
const { data: folders } = await supabase
    .from('spaces')
    .select('*')
    .eq('user_id', user.id)
    .is('parent_id', currentParentId)  // NULL for root
    .order('created_at', { ascending: false });

// Get items in current space
const { data: items } = await supabase
    .from('mind_links')
    .select('*')
    .eq('space_id', currentParentId || 'null')
    .order('created_at', { ascending: false });
```

## 🎯 User Flow

### Creating Nested Folders

1. **Root Level:**
   - Spaces tab খোলো
   - "+" বাটনে ক্লিক করো
   - "Work" নাম দিয়ে Create করো

2. **Sub-folder:**
   - "Work" folder এ ক্লিক করো
   - আবার "+" বাটনে ক্লিক করো
   - "Projects" নাম দিয়ে Create করো

3. **Deep Nesting:**
   - "Projects" এ ক্লিক করো
   - আবার "+" করে "Client A" তৈরি করো
   - এভাবে unlimited depth পর্যন্ত যেতে পারবে

### Moving Items

1. Home feed থেকে যেকোনো item খোলো
2. নিচে "Spaces" বাটনে ক্লিক করো
3. List থেকে space select করো
4. Item সেই space এ move হয়ে যাবে

### Viewing Space Contents

1. Spaces tab খোলো
2. যেকোনো folder এ ক্লিক করো
3. সেই space এর সব items দেখাবে
4. Breadcrumb দিয়ে navigate করো

## 🔒 Security

**Row Level Security (RLS) Enabled:**

- প্রতিটি user শুধু নিজের spaces দেখতে পারবে
- অন্য user এর spaces access করতে পারবে না
- Supabase automatically enforce করবে

**Cascade Delete:**

- Parent folder ডিলিট করলে সব child folders ও ডিলিট হবে
- Items থেকে `space_id` SET NULL হবে (items ডিলিট হবে না)

## 🚀 Performance

**Optimizations:**

1. **Indexed Queries:**
   - `user_id`, `parent_id`, `space_id` তে index আছে
   - Fast lookup এবং filtering

2. **Lazy Loading:**
   - শুধু current level এর folders load হয়
   - Deep nesting এ performance issue হবে না

3. **Minimal Queries:**
   - একটা query তে folders
   - একটা query তে items
   - Total 2 queries per navigation

## 📱 UI/UX

**Design Elements:**

- 📁 Folder icon (yellow color)
- 🔗 Link icon (for saved links)
- 📝 Note icon (for notes)
- ➡️ Breadcrumb arrows
- ⬅️ Back button

**Interactions:**

- Tap folder → Open
- Long press folder → Delete menu
- Tap item → Open detail
- Breadcrumb tap → Navigate

## 🐛 Troubleshooting

### Spaces না দেখালে:

1. SQL migration ঠিকমতো run হয়েছে কিনা check করো
2. Browser console এ error আছে কিনা দেখো
3. Supabase RLS policies enable আছে কিনা verify করো

### Items move হচ্ছে না:

1. `mind_links` table এ `space_id` column আছে কিনা check করো
2. Detail page এ console error দেখো
3. Supabase permissions check করো

## 🎉 Next Steps

এখন তুমি পারবে:

1. ✅ Unlimited nested folders তৈরি করতে
2. ✅ Items organize করতে
3. ✅ Breadcrumb navigation ব্যবহার করতে
4. ✅ Folders delete করতে (cascade)

**Future Enhancements:**

- 🔄 Drag & drop to move items
- 🎨 Custom folder colors/icons
- 📊 Folder statistics (item count)
- 🔍 Search within spaces
- 📤 Share spaces with others

---

**Enjoy organizing your mind! 🧠✨**
