// 初期表示時
$(function () {
    // CSS関連 - ヘッダー
    const element = document.querySelector(".column_header");
    // 横にスクロールした分、位置をずらす
    element.style.left = -window.pageXOffset + "px";
    window.addEventListener("scroll", () => {
        element.style.left = -window.pageXOffset + "px";
    });
    // ヘッダのインデントボタンのクリックイベント
    $("#indent_left").on("click", () => indent("left"))
    $("#indent_right").on("click", () => indent("right"))
    // テーブルヘッダ表示の日付けの更新
    setDateForTableHeader()
    // 選択、行入れ替え機能の付与
    setChangeRows()
    // イベントの付与
    setChangeEventDate()
    setProgBar()
    // テーブルの状態を保持
    init()
});

// 選択済み行を保持するデータ
let selectedRows = []
// 変更前テーブルの保持データ。テーブル行の順番が変わっても正順を維持
let tableRowsTmp = []
// 変更後のテーブル行番号を格納する配列
let tableRowsIndex = []
// 今日の日付
let today = ""

// テーブルヘッダ表示の日付けの更新
const setDateForTableHeader = () => {
    // テーブルヘッダに今日からカラム数がある分だけ日付けを書き出す
    const weekOfDays = ["日", "月", "火", "水", "木", "金", "土",]
    const year = new Date().getFullYear()
    const month = ("00" + (new Date().getMonth() + 1)).slice(-2)
    const date = new Date().getDate()
    const day = new Date().getDay()
    $("#head_year_month").html(`${year}/${month}`)
    $(".head_dates").each((i, col) => { col.innerHTML = ("00" + (date + i)).slice(-2) })
    $(".head_days").each((i, col) => {
        weekOfDay = (day + i) % 7
        col.innerHTML = weekOfDays[weekOfDay]
    })
    // 今日の日付をYYYY-MM-DDで表示
    today = `${year}-${month}-${("00" + (date)).slice(-2)}`

    // 各行の予定表列にクラス名で日付を付与する
    $("#column_table_body").children("tr").each((i, tableRow) => {
        tableRow.querySelectorAll(".col_day").forEach((col, index) => {
            col.setAttribute("name", `${year}-${month}-${("00" + (date + index)).slice(-2)}`)
        })
    })
}

// 変更前のテーブルの状態を保持するための初期化
const init = () => {
    $("#column_table_body").children("tr").each((i, tableRow) => {
        tableRowsTmp[i] = tableRow.cloneNode(true);
        tableRowsTmp[i].indentIndex = 0
        tableRowsIndex.push(i)
    })
}

// 選択、行入れ替え機能の付与
const setChangeRows = () => {
    $("#column_table_body").selectable({
        cancel: ".ui-selected",
        selected: function (e, item) {
            selectedRows = $("tr.ui-selected").clone();
        }
    }).sortable({
        // 縦方向限定
        axis: 'y',
        // 現在ドラッグ対象のオブジェクト（今回はテーブル行）
        items: "tr",
        // 並び替えヘルパーのオブジェクト
        helper: function (e, item) {
            selectedRows = $("tr.ui-selected").clone();
            // 要素移動中、掴んだ要素とその兄弟要素はテーブルから削除する
            item.data(selectedRows).siblings('.ui-selected').remove();
            return $("<tr>").append(selectedRows)
        },
        stop: function (e, item) {
            // 移動した先に掴んでいる要素の先頭の要素がitemに入る（1.2を持っていたら1）
            item.item.after(selectedRows)
            // 1.2を持っていたら「1.1.2」となるので要素を削除する
            item.item.remove()
            // 選択済みクラスを全て削除
            $(".ui-selected").each((i, elem) => {
                elem.classList.remove("ui-selected")
            })
            // 変更後のインデックスを取得
            tableRowsIndex = []
            selectedRows = []
            $(this).children("tr").each((i, changedRow) => {
                for (let j = 0; j < tableRowsTmp.length; j++) {
                    changedRow.classList.remove("ui-selected")
                    if (tableRowsTmp[j].isEqualNode(changedRow)) {
                        tableRowsIndex.push(j)
                    }
                }
            })
            // changeイベント、進捗バーのイベントの振り直し
            setChangeEventDate()
            setProgBar()
        }
    })
}

// インデントボタンを押された際の処理
const indent = (direction) => {
    const tableRows = $("#column_table_body").children("tr")
    // changedIndex ... 変更後のインデックスが入っている配列
    // orgIndex ... 0から正順で回るインデックス
    tableRowsIndex.forEach((changedIndex, orgIndex) => {
        for (let i = 0; i < selectedRows.length; i++) {
            // テーブル行と選択した行が同じものの場合、ボタンの向きに応じてインデント用のインデックスを加減
            if (tableRows[orgIndex].isEqualNode(selectedRows[i])) {
                if (direction === "left" && tableRowsTmp[changedIndex].indentIndex > 0) {
                    tableRowsTmp[changedIndex].indentIndex--
                }
                else if (direction === "right" && tableRowsTmp[changedIndex].indentIndex < 3) {
                    tableRowsTmp[changedIndex].indentIndex++
                }

                // 1ステップ12pxずつインデント
                const indentValue = 12
                // 表示中のテーブルのタイトルにインデントを付与
                tableRows[orgIndex].querySelector(".task_title").style.textIndent = `${tableRowsTmp[changedIndex].indentIndex * indentValue}px`

                // テーブル行の保持データを更新。テーブルからデータを複製しインデントインデックスは前回の値を引き継ぐ
                const indentIndexTmp = tableRowsTmp[changedIndex].indentIndex
                tableRowsTmp[changedIndex] = tableRows[orgIndex].cloneNode(true)
                tableRowsTmp[changedIndex].indentIndex = indentIndexTmp

                // 比較に扱いやすいデータにするため選択済みクラスは外す
                tableRowsTmp[changedIndex].classList.remove("ui-selected")
                for (let selected of tableRowsTmp[changedIndex].querySelectorAll(".ui-selected")) {
                    selected.classList.remove("ui-selected")
                }

                // 選択済み行もインデントを付与した状態に更新
                selectedRows[i] = tableRows[orgIndex]
            }
        }
    })
}

// カレンダー入力にchangeイベントを付与
const setChangeEventDate = () => {
    $("[id*='planSt_']").each((i) => { $(`#planSt_${i + 1}`).change(() => { checkDate(i + 1, "plan") }) })
    $("[id*='planEd_']").each((i) => { $(`#planEd_${i + 1}`).change(() => { checkDate(i + 1, "plan") }) })
    $("[id*='actSt_']").each((i) => { $(`#actSt_${i + 1}`).change(() => { checkDate(i + 1, "act") }) })
    $("[id*='actEd_']").each((i) => { $(`#actEd_${i + 1}`).change(() => { checkDate(i + 1, "act") }) })
}

// 日付けがセットされた後の挙動
const checkDate = (index, process) => {
    // 日付けをセットした行を取得
    const stDate = $(`#${process}St_${index}`).val()
    const edDate = $(`#${process}Ed_${index}`).val()
    // 終了日は開始日以前を設定できないようにする
    $(`#${process}Ed_${index}`).attr("min", stDate)
    //開始、終了の日付けがセットされているか確認
    if (stDate !== "" && edDate !== "") {
        // 、予定、実績それぞれの開始/終了がセットされていれば差分を計算する
        const diffDay = calcDiffDay(stDate, edDate)
        $(`#${process}Dif_${index}`).html(diffDay)
        // チャート出力
        setChartBar(stDate, edDate, diffDay, process, index)
    }
    // 選択済み行に変更があったら都度更新
    selectedRows = $("tr.ui-selected").clone();
}

// 設定した開始日、終了日の情報をもとにチャートバーを作成
const setChartBar = (stDate, edDate, diffDay, process, index) => {
    // もしも差分日数が0かマイナス値になっていた場合はバーを非表示にして早期return
    if (diffDay < 1) {
        $(`#${process}Bar_${index}`).css("display", "none")
        return
    }
    // 日付けをセットした行を取得
    const selectedRow = $(`#${process}St_${index}`).parent().parent()
    // 非表示にしたバーを再表示
    $(`#${process}Bar_${index}`).css("display", "block")
    // チャートの起点を決める
    let selectedDateCol = selectedRow.children(`td[name=${stDate}]`)
    if (stDate < today) {
        // 本日以前の日付けを選んだ場合、起点は本日とする
        selectedDateCol = selectedRow.children(`td[name=${today}]`)
    }
    else if (selectedRow.children(`td[name=${stDate}]`).length < 1) {
        // テーブルにない日付けを開始日に選択した場合、バーを消して早期return
        $(`#${process}Bar_${index}`).css("display", "none")
        return
    }
    // 起点は全ての日付けカラム内の何番目か
    let startColumnIndex = 0
    let columnCount = 0
    selectedRow.children(".col_day").each((i, column) => {
        if (column.isEqualNode(selectedDateCol[0])) {
            startColumnIndex = i
        }
        columnCount = i + 1
    })
    // 差分がバーのチャートバーのカラムサイズとなる
    let barColumCount = diffDay
    // 開始日が本日の日付け以前の場合、開始日から本日までの差分を取得
    if (stDate < today) {
        const diffDayForToday = calcDiffDay(stDate, today)
        barColumCount -= diffDayForToday - 1
    }
    // 差分が起点以降の空きカラム数を超えたらバーのサイズは空きカラムの領域を超えないようにする
    if (barColumCount > (columnCount - startColumnIndex)) {
        barColumCount = columnCount - startColumnIndex
    }
    // 1本分のボーダーサイズを取得
    const border = (selectedDateCol.outerWidth() - selectedDateCol.innerWidth()) / 2
    // 要素の幅+ボーダー*カラム数でバーサイズを計算
    const barSize = ((selectedDateCol.innerWidth() + border) * barColumCount)
    // 起点と終端のpadding = 1px分を調整しバーの幅を設定
    $(`#${process}Bar_${index}`).css("width", `${barSize - 2}px`)
    // 起点の情報を取得出来たらバーを設定した起点に移動
    if (selectedDateCol.length > 0) selectedDateCol.append($(`#${process}Bar_${index}`))
}

// 予定、実績にセットされた日付けの差分を計算
const calcDiffDay = (stDate, edDate) => {
    const startDate = new Date(stDate)
    const endDate = new Date(edDate)
    const diffTime = endDate.getTime() - startDate.getTime()
    let diffDay = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1
    // マイナス値になった場合は0を設定しておく
    if (diffDay < 0) diffDay = 0
    return diffDay
}

// 進捗バー操作で予定バーの色を塗りつぶす
const setProgBar = () => {
    $("[id*='prog_']").each((i) => {
        $(`#prog_${i + 1}`).on("input", () => {
            $(`#progBar_${i + 1}`).css("width", `${$(`#prog_${i + 1}`).val()}%`)
            // 選択済み行に変更があったら都度更新
            selectedRows = $("tr.ui-selected").clone();
        })
    })
}
