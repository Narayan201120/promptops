# PromptOps Testing Guide

## Quick Test Workflow

### 1. Start the Application

```bash
# Terminal 1 - Backend
cd backend
python manage.py runserver

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 2. Login
- Go to http://localhost:5173
- Login with: `demo` / `demo123`

## Feature Testing

### Test 1: View Existing Prompts
1. After login, you should see the dashboard
2. Verify you see 3 demo prompts:
   - Blog Post Writer
   - Code Reviewer
   - Email Generator
3. Each card should show:
   - Title
   - Description
   - Version number (v1)
   - Last updated date

✅ **Expected**: Grid of 3 prompt cards

### Test 2: Create New Prompt
1. Click "New Prompt" button (top right)
2. Fill in the form:
   - Title: "Test Prompt"
   - Description: "A test prompt for testing"
   - Content: "Write a test about {{topic}}"
3. Click "Create Prompt"

✅ **Expected**: Redirected to prompt detail page

### Test 3: View Prompt Details
1. From dashboard, click any prompt card
2. Verify you see:
   - Title at top
   - Version number and last updated
   - Description
   - Content in code block
   - "History" and "Back" buttons
   - "Edit" and "Delete" buttons

✅ **Expected**: Full prompt details displayed

### Test 4: Edit Prompt (Creates Version)
1. On prompt detail page, click "Edit"
2. Modify the content (add some text)
3. Click "Save"
4. Verify:
   - Version number increased (e.g., v1 → v2)
   - Content updated
   - Edit mode closed

✅ **Expected**: New version created automatically

### Test 5: View Version History
1. On prompt detail page, click "History"
2. Verify you see:
   - All versions listed (newest first)
   - "Current" badge on latest version
   - Each version shows content
   - "Revert" button on old versions

✅ **Expected**: Complete version history

### Test 6: Revert to Previous Version
1. On version history page
2. Click "Revert" on an older version
3. Confirm the dialog
4. Verify:
   - Redirected to detail page
   - Content reverted to old version
   - New version created (e.g., v3)

✅ **Expected**: Content reverted, new version created

### Test 7: Delete Prompt
1. On prompt detail page, click "Delete"
2. Confirm the dialog
3. Verify:
   - Redirected to dashboard
   - Prompt no longer in list

✅ **Expected**: Prompt deleted

### Test 8: Navigation
1. Test all navigation links:
   - "PromptOps" logo → Dashboard
   - "Prompts" link → Dashboard
   - "Back" buttons → Previous page
   - "History" button → Version history
2. Verify navigation bar shows:
   - Your email
   - Organization name
   - Logout button

✅ **Expected**: All navigation works

### Test 9: Logout
1. Click "Logout" in navigation
2. Verify:
   - Redirected to login page
   - Cannot access dashboard without login

✅ **Expected**: Logged out successfully

### Test 10: Responsive Design
1. Resize browser window
2. Test on mobile size (< 768px)
3. Verify:
   - Layout adapts
   - All buttons accessible
   - Text readable
   - Forms usable

✅ **Expected**: Works on all screen sizes

## API Testing (Optional)

### Test with curl

```bash
# Login
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","password":"demo123"}'

# Save the access token, then:

# List prompts
curl http://localhost:8000/api/prompts/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Create prompt
curl -X POST http://localhost:8000/api/prompts/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"API Test","description":"Test","content":"Test content"}'
```

## Common Issues

### Issue: "Network Error"
**Solution**: Make sure backend is running on port 8000

### Issue: "401 Unauthorized"
**Solution**: Token expired, logout and login again

### Issue: Prompts not showing
**Solution**: Run `python manage.py create_test_data` in backend

### Issue: Version not incrementing
**Solution**: Make sure you're actually changing the content field

### Issue: Can't delete prompt
**Solution**: Check browser console for errors, verify permissions

## Browser Console

Open browser DevTools (F12) to see:
- Network requests
- API responses
- JavaScript errors
- React Query cache

## Success Criteria

All tests should pass:
- ✅ Can create prompts
- ✅ Can view prompts
- ✅ Can edit prompts (creates versions)
- ✅ Can view version history
- ✅ Can revert to old versions
- ✅ Can delete prompts
- ✅ Navigation works
- ✅ Logout works
- ✅ Responsive design works

## Performance Checks

- Dashboard loads in < 1 second
- Prompt detail loads in < 500ms
- Version history loads in < 500ms
- No console errors
- Smooth transitions between pages

## Next Steps After Testing

If all tests pass:
1. ✅ Prompt management is complete
2. ✅ Ready for LLM integration
3. ✅ Can start building test sandbox

If tests fail:
1. Check browser console for errors
2. Check backend logs
3. Verify database has data
4. Check API responses in Network tab

---

**Happy Testing!** 🎉
