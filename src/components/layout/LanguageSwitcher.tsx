import { useTranslation } from "react-i18next";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const current = i18n.language === "hi" ? "hi" : "en";

  const onChange = (value: string) => {
    void i18n.changeLanguage(value);
    localStorage.setItem("lang", value);
  };

  return (
    <Select value={current} onValueChange={onChange}>
      <SelectTrigger className="w-28">
        <SelectValue placeholder="Language" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="en">English</SelectItem>
        <SelectItem value="hi">हिंदी</SelectItem>
      </SelectContent>
    </Select>
  );
};

export default LanguageSwitcher;
