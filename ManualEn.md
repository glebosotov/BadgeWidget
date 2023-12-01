# How to start using BadgeWidget

## Prerequisites

- Download [Scriptable app](https://scriptable.app)

## SMS trigger setup

- Download [this shortcut](https://routinehub.co/shortcut/16887/)
- Go to iPhone Shortcuts App
- Choose "Automation" tab at the bottom
- Create new automation
- Choose Message as a trigger (with green icon)
- In the "Message contains" write the following text
  - `Balans (RUB)`
- Press "Run immediately"
- In the actions for the automation choose "New blank automation"
- Press "Add action"
- Look for "Run Shortcut" action
- Choose the shortcut that you have downloaded (this one)
- Expand the "Run Shortcut" block and choose the input parameter slot
- Assign the input of the automation to the shortcut input
- Press "done"

## Widget setup

- Use [this shortcut](https://routinehub.co/shortcut/16954) to create or update the source code file
  - It will be used both by scriptable to show widget and by shortcuts to save data
  - Warning ⚠️ If you have script named "Badge" it will be overwritten
- Go to Home screen
- Add widget from Scriptable app
  - Can be small or medium
- Long press the widget to configure
- Choose Badge script
- ✅ Done

## First run

- To grant permissions copy the text of one of the last sms
- Open Shortcuts app
- Press on the shortcut that you have downloaded (now it is called Save Balance)
- Answer "allow always" to all questions
