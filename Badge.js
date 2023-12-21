// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-green; icon-glyph: magic;

// constants
const fileName = 'cardBalance.json';
const maxBalancePerDay = 1000;
const useiCloud = true;

// Function to parse date from string
function parseDateFromString(dateString) {
    // Split the date string into day, month, and year
    let [day, month, year] = dateString.split(".");

    // Ensure two-digit format for day and month
    day = day.padStart(2, "0");
    month = month.padStart(2, "0");

    // Create a Date object and return it
    return new Date(`20${year}-${month}-${day}`);
}

function extractNumbers(inputString) {
    const match = inputString.match(/(-?\d+\.\d+|\d+)\/(-?\d+\.\d+|\d+)/);
    if (match) {
        const [, firstNumber, secondNumber] = match;
        return [parseInt(firstNumber, 10), parseInt(secondNumber, 10)];
    } else {
        return null; // Return null if no match is found
    }
}

// Function to save card balance
function saveCardBalance(date, balance, daysBalance) {
    var fileManager;
    if (useiCloud) {
        fileManager = FileManager.iCloud();
    } else {
        fileManager = FileManager.local();
    }
    let path = fileManager.joinPath(
        fileManager.documentsDirectory(),
        fileName,
    );

    // Load existing data or initialize an empty object
    let savedData = {};
    if (fileManager.fileExists(path)) {
        let content = fileManager.readString(path);
        savedData = JSON.parse(content);
    }

    // Extract the number to the left of 800
    let balanceNumber = extractNumbers(balance)[0];

    // Save or update balance for the given date
    let dateString = date.toLocaleDateString("ru-RU");
    savedData[dateString] = {
        money: balanceNumber,
        daysLeft: daysBalance[0],
        daysTotal: daysBalance[1],
    };

    console.log(savedData);

    // Save the updated data
    fileManager.write(path, Data.fromString(JSON.stringify(savedData)));
}

function getDatesFromNowToMonthStart() {
    const currentDate = new Date();
    const currentDay = currentDate.getDate();
    const daysUntilMonthStart = currentDay - 1; // Calculate days from now to the start of the month
    const startDate = new Date(currentDate);
    startDate.setDate(currentDay - daysUntilMonthStart);

    const datesArray = [];
    for (let i = 0; i <= daysUntilMonthStart; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        datesArray.push(date);
    }

    return datesArray.reverse();
}

function countWeekendDays(startDate, endDate) {
    let count = 0;
    let currentDate = new Date(startDate);

    while (currentDate.getFullYear() <= endDate.getFullYear() &&
        currentDate.getMonth() <= endDate.getMonth() &&
        currentDate.getDate() <= endDate.getDate()) {

        const dayOfWeek = currentDate.getDay();

        // Check if the current day is Saturday (6) or Sunday (0)
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            count++;
        }

        // Move to the next day
        currentDate.setDate(currentDate.getDate() + 1);
    }

    return count;
}

// Function to retrieve latest card balance
function getLatestCardBalance() {
    // Assuming data is saved in iCloud Drive
    var fileManager;
    if (useiCloud) {
        fileManager = FileManager.iCloud();
    } else {
        fileManager = FileManager.local();
    }
    let path = fileManager.joinPath(
        fileManager.documentsDirectory(),
        fileName,
    );

    // Load existing data or return null if no data is found
    if (fileManager.fileExists(path)) {
        let content = fileManager.readString(path);
        let savedData = JSON.parse(content);

        let todayDate = new Date();
        // Get today's date in dd.mm.yy format
        let today = todayDate.toLocaleDateString("ru-RU");


        // Check if today's data exists, else return null
        if (savedData[today]) {
            let todayData = savedData[today];
            console.log('Found data from today');
            return {
                money: todayData.money,
                daysLeft: todayData.daysLeft,
                daysTotal: todayData.daysTotal,
                workingDaysMissedFromLastAlert: 0,
                spentToday: true,
            };
        } else {
            for (const date of getDatesFromNowToMonthStart()) {
                let stringDate = new Date(date.valueOf()).toLocaleDateString("ru-RU");
                if (savedData[stringDate]) {
                    let weekendDaysFromLastAlert = countWeekendDays(date, todayDate);
                    let daysFromLastAlert = todayDate.getDate() - date.getDate();


                    let workingDaysMissedFromLastAlert = daysFromLastAlert - weekendDaysFromLastAlert;
                    let didOverdraftLastTime = savedData[stringDate].money < 0;
                    console.log(`Found data from ${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`);
                    return {
                        money: maxBalancePerDay,
                        daysLeft: savedData[stringDate].daysLeft - (didOverdraftLastTime ? 0 : 1),
                        daysTotal: savedData[stringDate].daysTotal,
                        workingDaysMissedFromLastAlert: workingDaysMissedFromLastAlert,
                        spentToday: false,
                    }
                }
            }
            console.log(`No data this month`);
            return {
                money: maxBalancePerDay,
                daysLeft: 0,
                daysTotal: 0,
                workingDaysMissedFromLastAlert: 0,
                spentToday: false,
            };
        }
    } else {
        console.log('No saved file');
        return {
            money: maxBalancePerDay,
            daysLeft: 0,
            daysTotal: 0,
            workingDaysMissedFromLastAlert: 0,
            spentToday: false,
        };
    }
}

function countNonWeekendDays() {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);

    let count = 0;
    let currentDateIterator = new Date(firstDayOfMonth);

    while (currentDateIterator <= lastDayOfMonth) {
        const dayOfWeek = currentDateIterator.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            count++;
        }
        currentDateIterator.setDate(currentDateIterator.getDate() + 1);
    }

    return count;
}

function countRemainingWorkingDays(balanceDays, balanceMoney, spentToday) {
    const currentDate = new Date();

    // We do not know the balance at the start of the month, so ignore it
    if (currentDate.getDate() === 1) {
        return 0;
    }

    const daysInMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0
    ).getDate();
    let workingDaysLeft = 0;

    for (let i = currentDate.getDate(); i <= daysInMonth; i++) {
        const currentDay = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth(),
            i
        ).getDay();

        if (currentDay !== 0 && currentDay !== 6) {
            workingDaysLeft++;
        }
    }

    let additionalDayPresent = (balanceMoney > 0 && spentToday) || !spentToday;
    console.log(`Working days left: ${workingDaysLeft}\nSpent today: ${spentToday}\nBalance days: ${balanceDays}\nAdditional day present: ${additionalDayPresent}`);

    return workingDaysLeft - (additionalDayPresent ? 0 : 1) - balanceDays;
}

function formatDaysString(numDays, secondPart) {
    return numDays === 1
        ? `${numDays} ${secondPart} day`
        : `${numDays} ${secondPart} days`;
}

// Function to create a Scriptable widget
function createCardBalanceWidget() {
    let imageBase64 =
            "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";

    // Create a new widget
    let widget = new ListWidget();

    // Retrieve latest card balance
    let latestData = getLatestCardBalance();
    console.log(latestData);
    let latestBalance = latestData.money;
    let latestDaysLeft = latestData.daysLeft;
    let spentToday = latestData.spentToday;
    let latestDaysTotal = latestData.daysTotal;
    // let workingDaysMissedFromLastAlert = latestData.workingDaysMissedFromLastAlert;

    if (config.widgetFamily != null && config.widgetFamily.startsWith('accessory')) {
        let balanceStack = widget.addStack();
        balanceStack.layoutHorizontally();
        balanceStack.bottomAlignContent();
        let image = Image.fromData(Data.fromBase64String(imageBase64));
        let imageColumn = balanceStack.addStack();
        imageColumn.setPadding(0, 0, 4, 0);
        let widgetImage = imageColumn.addImage(image);
        
        if (config.widgetFamily === 'accessoryRectangular') {
            widgetImage.imageSize = new Size(17, 17);
            let balanceDescriptionText = balanceStack.addText('Badge ');
            balanceDescriptionText.font = BALANCE_FONT_LOCKSCREEN;
        } else {
            widgetImage.imageSize = new Size(10, 10);
        }
        let balanceText = balanceStack.addText(latestBalance.toString());
        balanceText.font = BALANCE_FONT_LOCKSCREEN;
        balanceText.minimumScaleFactor = 0.7;
        balanceText.lineLimit = 1;

        // balanceStack.setPadding(4, 2, 4, 2);
        let rubleSign = balanceStack.addText("₽");
        rubleSign.font = CURRENCY_FONT_LOCKSCREEN;
        rubleSign.minimumScaleFactor = 0.5;

        // Debug
        let debug = false;
        if (debug) {
            balanceStack.backgroundColor = new Color("#00ff00");
        }
    } else {
        let headerStack = widget.addStack();

        let header = "Balance";
        let headerText = headerStack.addText(header);
        headerText.font = HEADER_FONT;
        // headerText.textColor = PRIMARY_TEXT_COLOR;

        headerStack.addSpacer();

        
        let image = Image.fromData(Data.fromBase64String(imageBase64));
        let imageColumn = headerStack.addStack();
        imageColumn.setPadding(4, 0, 0, 0);
        let widgetImage = imageColumn.addImage(image);
        widgetImage.imageSize = new Size(20, 20);

        let balanceStack = widget.addStack();
        balanceStack.bottomAlignContent();

        var balanceText;
        balanceText = balanceStack.addText(latestBalance.toString());

        // balanceText.textColor = PRIMARY_TEXT_COLOR;
        balanceText.font = BALANCE_FONT;

        let column2 = balanceStack.addStack();
        column2.layoutVertically();
        column2.setPadding(2, 2, 4, 2);

        let rubleSign = column2.addText("₽");
        rubleSign.font = CURRENCY_FONT;
        // rubleSign.textColor = PRIMARY_TEXT_COLOR;

        widget.addSpacer();

        let extraDaysStack = widget.addStack();
        let extraDaysTextStack = extraDaysStack.addStack();
        extraDaysStack.bottomAlignContent();
        var daysLeftText;
        let missingDays = countRemainingWorkingDays(latestDaysLeft, latestBalance, spentToday);
        let nonWeekendDays = countNonWeekendDays();

        // This month contains extra holidays
        if (nonWeekendDays != latestDaysTotal && latestDaysTotal != 0) {
            console.log("This month has extra holidays, displaying raw days balance");
            daysLeftText = extraDaysTextStack.addText(`${latestDaysLeft}/${latestDaysTotal} (🎁🍹)`);
            extraDaysTextStack.backgroundColor = EVEN_DAYS_COLOR;
        } else {
            if (missingDays < 0) {
                daysLeftText = extraDaysTextStack.addText(
                    formatDaysString(-missingDays, "extra")
                );
            } else if (missingDays > 0) {
                daysLeftText = extraDaysTextStack.addText(
                    formatDaysString(missingDays, "missing")
                );
            } else {
                daysLeftText = extraDaysTextStack.addText("👌🏼");
            }
            extraDaysTextStack.backgroundColor =
                missingDays === 0 ? EVEN_DAYS_COLOR : UNEVEN_DAYS_COLOR;
        }

        extraDaysTextStack.cornerRadius = 10;
        extraDaysTextStack.setPadding(4, 6, 4, 6);
        daysLeftText.font = FOOTER_FONT;
        daysLeftText.textColor = DAYS_COLOR;

        extraDaysStack.addSpacer();
        // Last updated time
        const updateTime = extraDaysStack.addText(
            new Date().toLocaleTimeString("ru-RU", {
                hour: "2-digit",
                minute: "2-digit",
            })
        );
        updateTime.font = SERVICE_FONT;
        updateTime.textColor = SERVICE_COLOR;
        updateTime.textOpacity = 0.5;

        extraDaysStack.layoutHorizontally();

        // Debug
        let debug = false;
        if (debug) {
            headerStack.backgroundColor = new Color("#ff0000");
            balanceStack.backgroundColor = new Color("#00ff00");
            column2.backgroundColor = new Color("#0000ff");
            extraDaysStack.backgroundColor = new Color("#ffff00");
            extraDaysTextStack.backgroundColor = new Color("#ff00ff");
            imageColumn.backgroundColor = new Color("#00ffff");
        }
    }
    // Present the widget
    if (config.runsInWidget) {
        Script.setWidget(widget);
    } else {
        widget.presentMedium();
    }
}

const BALANCE_FONT = Font.boldSystemFont(40);
const BALANCE_FONT_LOCKSCREEN = Font.boldSystemFont(20);
const HEADER_FONT = Font.semiboldSystemFont(20);
const CURRENCY_FONT = Font.semiboldSystemFont(24);
const CURRENCY_FONT_LOCKSCREEN = Font.semiboldSystemFont(14);
const FOOTER_FONT = Font.semiboldSystemFont(12);
const SERVICE_FONT = Font.semiboldSystemFont(8);

if (Device.isUsingDarkAppearance()) {
    var BG_COLOR = new Color("#191a19");
    // var PRIMARY_TEXT_COLOR = new Color("#FAF9F6");
    var UNEVEN_DAYS_COLOR = new Color("#FE4639");
    var DAYS_COLOR = new Color("#FFFFFF");
    var EVEN_DAYS_COLOR = new Color("#2FD15D");
    var SERVICE_COLOR = new Color("#9E9E9E");
} else {
    var BG_COLOR = new Color("#e5e6e4");
    // var PRIMARY_TEXT_COLOR = new Color("#101010");
    var UNEVEN_DAYS_COLOR = new Color("#FD3F32");
    var DAYS_COLOR = new Color("#FFFFFF");
    var EVEN_DAYS_COLOR = new Color("#13C759");
    var SERVICE_COLOR = new Color("#8C8C8C");
}

if (config.runsInWidget) {
    createCardBalanceWidget();
} else if (config.runsInApp) {
    // Retrieve latest card balance
    let latestData = getLatestCardBalance();
    let latestBalance = latestData.money;
    let latestDaysLeft = latestData.daysLeft;
    let latestDaysTotal = latestData.daysTotal;
    let spentToday = latestData.spentToday;

    let workingDaysMissedFromLastAlert = latestData.workingDaysMissedFromLastAlert;

    console.log(JSON.parse(JSON.stringify(latestData)));

    let missingDays = countRemainingWorkingDays(latestDaysLeft, latestBalance, spentToday);

    let alert = new Alert();

    if (latestData == null) {
        alert.title = "No data found";
    } else {
        alert.title = "Current balance";
        alert.message = `Balance: ${latestBalance}\nDays left: ${latestDaysLeft}/${latestDaysTotal}\n\n${missingDays > 0
            ? `Missing days: ${missingDays}`
            : `Extra days: ${-missingDays}`
            }`;
    }
    alert.addAction("Present widget");
    alert.addAction("OK");

    let result = await alert.presentSheet();
    if (result == 0) {
        createCardBalanceWidget();
    }
} else {
    /*
    Go!Poedim, 13.10.23 11:13
    Oplata: 135.00
    Balans (RUB): 446.00/800
    Balans (dni): 15/22
    */
    // Example usage:
    let lastTransactionDate = args.plainTexts[0];
    let currentBalance = args.plainTexts[1];
    let daysBalance = args.plainTexts[2];

    // Parse date from string
    let parsedDate = parseDateFromString(lastTransactionDate);

    // Parse days balance from string
    let parsedDaysBalance = extractNumbers(daysBalance);

    // Save card balance
    saveCardBalance(parsedDate, currentBalance, parsedDaysBalance);
    Script.complete();
}
