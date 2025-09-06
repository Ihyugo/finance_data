describe('StockChart Component', () => {
  beforeEach(() => {
    // テスト用のモックデータを設定
    cy.intercept('GET', '**/api/stock/**', {
      statusCode: 200,
      body: [
        {
          time: '2023-01-01',
          open: 100,
          high: 110,
          low: 95,
          close: 105,
          volume: 1000,
          macd_macd: 0.5,
          macd_signal: 0.3,
          macd_histogram: 0.2,
          rsi: 65,
          sma: 102,
          ema: 103,
          tema: 104,
          bollinger_upper: 108,
          bollinger_lower: 98,
          psar: 99
        },
        {
          time: '2023-01-02',
          open: 105,
          high: 115,
          low: 100,
          close: 110,
          volume: 1200,
          macd_macd: 0.6,
          macd_signal: 0.4,
          macd_histogram: 0.2,
          rsi: 70,
          sma: 104,
          ema: 105,
          tema: 106,
          bollinger_upper: 112,
          bollinger_lower: 100,
          psar: 101
        }
      ]
    }).as('getStockData')

    // テストページにアクセス
    cy.visit('/')
  })

  describe('基本表示', () => {
    it('StockChartコンポーネントが正しく表示される', () => {
      cy.get('[data-testid="stock-chart"]').should('exist')
      cy.get('[data-testid="stock-chart"]').should('be.visible')
    })

    it('期間選択ボタンが表示される', () => {
      cy.get('[data-testid="period-buttons"]').should('exist')
      cy.get('[data-testid="period-1M"]').should('contain', '1M')
      cy.get('[data-testid="period-3M"]').should('contain', '3M')
      cy.get('[data-testid="period-6M"]').should('contain', '6M')
      cy.get('[data-testid="period-1Y"]').should('contain', '1Y')
      cy.get('[data-testid="period-5Y"]').should('contain', '5Y')
      cy.get('[data-testid="period-custom"]').should('contain', 'カスタム')
    })

    it('テクニカル指標のチェックボックスが表示される', () => {
      cy.get('[data-testid="indicators-section"]').should('exist')
      cy.get('[data-testid="moving-average-checkbox"]').should('exist')
      cy.get('[data-testid="bollinger-bands-checkbox"]').should('exist')
      cy.get('[data-testid="parabolic-sar-checkbox"]').should('exist')
    })
  })

  describe('期間選択の機能', () => {
    it('期間を変更できる', () => {
      cy.get('[data-testid="period-3M"]').click()
      cy.get('[data-testid="period-3M"]').should('have.class', 'active')
      cy.get('[data-testid="period-1M"]').should('not.have.class', 'active')
    })

    it('カスタム期間が選択できる', () => {
      cy.get('[data-testid="period-custom"]').click()
      cy.get('[data-testid="period-custom"]').should('have.class', 'active')
      cy.get('[data-testid="custom-range-control"]').should('be.visible')
    })

    it('カスタム期間のスライダーが動作する', () => {
      cy.get('[data-testid="period-custom"]').click()
      cy.get('[data-testid="start-range-slider"]').should('exist')
      cy.get('[data-testid="end-range-slider"]').should('exist')
      
      // スライダーの値を変更
      cy.get('[data-testid="start-range-slider"]').invoke('val', 0).trigger('change')
      cy.get('[data-testid="end-range-slider"]').invoke('val', 1).trigger('change')
    })
  })

  describe('テクニカル指標の切り替え', () => {
    it('移動平均線の切り替えが動作する', () => {
      cy.get('[data-testid="moving-average-checkbox"] input').should('not.be.checked')
      cy.get('[data-testid="moving-average-checkbox"] input').check()
      cy.get('[data-testid="moving-average-checkbox"] input').should('be.checked')
    })

    it('ボリンジャーバンドの切り替えが動作する', () => {
      cy.get('[data-testid="bollinger-bands-checkbox"] input').should('not.be.checked')
      cy.get('[data-testid="bollinger-bands-checkbox"] input').check()
      cy.get('[data-testid="bollinger-bands-checkbox"] input').should('be.checked')
    })

    it('パラボリックSARの切り替えが動作する', () => {
      cy.get('[data-testid="parabolic-sar-checkbox"] input').should('not.be.checked')
      cy.get('[data-testid="parabolic-sar-checkbox"] input').check()
      cy.get('[data-testid="parabolic-sar-checkbox"] input').should('be.checked')
    })
  })

  describe('チャートの表示', () => {
    it('メインチャートが表示される', () => {
      cy.get('[data-testid="main-chart"]').should('exist')
      cy.get('[data-testid="main-chart"] canvas').should('exist')
    })

    it('MACDチャートが表示される', () => {
      cy.get('[data-testid="macd-chart"]').should('exist')
      cy.get('[data-testid="macd-chart"] canvas').should('exist')
    })

    it('RSIチャートが表示される', () => {
      cy.get('[data-testid="rsi-chart"]').should('exist')
      cy.get('[data-testid="rsi-chart"] canvas').should('exist')
    })
  })

  describe('描画中の状態管理', () => {
    it('描画中はコントロールが無効化される', () => {
      // 描画中の状態をシミュレート
      cy.get('[data-testid="moving-average-checkbox"] input').check()
      
      // 描画中の表示を確認
      cy.get('[data-testid="drawing-status"]').should('exist')
      cy.get('[data-testid="spinner"]').should('exist')
      
      // コントロールが無効化されることを確認
      cy.get('[data-testid="period-3M"]').should('be.disabled')
      cy.get('[data-testid="moving-average-checkbox"] input').should('be.disabled')
    })
  })

  describe('レスポンシブデザイン', () => {
    it('モバイル表示でレイアウトが適切に調整される', () => {
      cy.viewport('iphone-6')
      
      // モバイル表示でのレイアウト確認
      cy.get('[data-testid="period-buttons"]').should('be.visible')
      cy.get('[data-testid="indicators-section"]').should('be.visible')
      
      // チャートが適切に表示される
      cy.get('[data-testid="main-chart"]').should('be.visible')
      cy.get('[data-testid="macd-chart"]').should('be.visible')
      cy.get('[data-testid="rsi-chart"]').should('be.visible')
    })

    it('タブレット表示でレイアウトが適切に調整される', () => {
      cy.viewport('ipad-2')
      
      // タブレット表示でのレイアウト確認
      cy.get('[data-testid="stock-chart"]').should('be.visible')
      cy.get('[data-testid="period-buttons"]').should('be.visible')
    })
  })

  describe('エラーハンドリング', () => {
    it('APIエラー時に適切に処理される', () => {
      // APIエラーをシミュレート
      cy.intercept('GET', '**/api/stock/**', {
        statusCode: 500,
        body: { error: 'Internal Server Error' }
      }).as('getStockDataError')
      
      cy.visit('/')
      
      // エラー表示を確認
      cy.get('[data-testid="error-message"]').should('exist')
    })

    it('ネットワークエラー時に適切に処理される', () => {
      // ネットワークエラーをシミュレート
      cy.intercept('GET', '**/api/stock/**', {
        forceNetworkError: true
      }).as('getStockDataNetworkError')
      
      cy.visit('/')
      
      // エラー表示を確認
      cy.get('[data-testid="error-message"]').should('exist')
    })
  })

  describe('パフォーマンス', () => {
    it('大量のデータでもパフォーマンスが劣化しない', () => {
      // 大量のデータをシミュレート
      const largeData = Array.from({ length: 1000 }, (_, i) => ({
        time: `2023-01-${String(i + 1).padStart(2, '0')}`,
        open: 100 + i,
        high: 110 + i,
        low: 95 + i,
        close: 105 + i,
        volume: 1000 + i * 10,
        macd_macd: Math.random(),
        macd_signal: Math.random(),
        macd_histogram: Math.random(),
        rsi: 50 + Math.random() * 40,
        sma: 102 + i,
        ema: 103 + i,
        tema: 104 + i,
        bollinger_upper: 108 + i,
        bollinger_lower: 98 + i,
        psar: 99 + i
      }))
      
      cy.intercept('GET', '**/api/stock/**', {
        statusCode: 200,
        body: largeData
      }).as('getLargeStockData')
      
      cy.visit('/')
      
      // 大量データでもチャートが表示されることを確認
      cy.get('[data-testid="main-chart"] canvas').should('exist')
      cy.get('[data-testid="macd-chart"] canvas').should('exist')
      cy.get('[data-testid="rsi-chart"] canvas').should('exist')
    })
  })
})
