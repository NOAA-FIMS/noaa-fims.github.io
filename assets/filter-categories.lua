function Meta(meta)
  if meta.categories then
    local filtered = {}
    for _, cat in ipairs(meta.categories) do
      if cat ~= "fims-weekly" and cat ~= "deep-dive" then
        table.insert(filtered, cat)
      end
    end
    meta.filtered_categories = filtered
  end
  return meta
end