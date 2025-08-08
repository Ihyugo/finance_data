<template>
  <div>
    <div class="px-4 py-5 my-5 text-center">
      <h1 class="display-5 fw-bold text-body-emphasis">
        404 Not Found
      </h1>
      <div class="col-lg-6 mx-auto">
        <h3 class="lead mb-4">
          アクセスしようとしたページは見つかりませんでした。
        </h3>
        <p class="lead mb-4">
          URLが間違っているか、ページが削除された可能性がございます。
        </p>
        <p class="lead mb-4">
          ご不便おかけいたしますが、URLをご確認いただくか、
        </p>

        <p class="lead mb-4">
          ホーム画面から通常通りサイド検索をお願いします。
        </p>

        <div class="d-grid gap-2 d-sm-flex justify-content-sm-center">
          <router-link
            to="/"
            type="button"
            class="btn btn-primary btn-lg px-4 gap-3"
          >
            ホームに戻る
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "NotFound",
};
</script>
